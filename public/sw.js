/* Only public static assets are cached. Family data and HTML are always online.
   Version each asset cache separately so audio updates retain downloaded artwork. */
const VERSION = 'kanto-public-v6';
const IMAGE_CACHE = 'kanto-public-v5-images';
const RESOURCE_CACHE = 'kanto-public-v5-resources';
const AUDIO_CACHE = `${VERSION}-audio`;
const IMAGE_LIMIT = 512;
const IMAGE_BUDGET = 48_000_000;
const IMAGE_MAX_BYTES = 1_500_000;
const RESOURCE_LIMIT = 120;
const AUDIO_LIMIT = 180;
const AUDIO_MAX_BYTES = 350_000;
const SHELL = ['/offline.html', '/icons/icon-192.png'];
const SCENE_AUDIO = [
  '/audio/effects/evolution.mp3', '/audio/effects/evolution-success.mp3',
  '/audio/effects/capture.mp3', '/audio/effects/capture-success.mp3',
  '/audio/effects/gift.mp3',
];
const writes = new Map();
const audioWarming = new Map();
const imageSizes = new Map();

function isPublicImage(pathname) {
  return /^\/(?:pokemon\/\d+|encyclopedia\/[a-z0-9/_-]+|illustrations\/[a-z0-9/_-]+|icons\/[a-z0-9/_-]+|logo(?:-pokeball)?)\.(?:png|jpe?g|webp|avif)$/.test(pathname);
}

function isCacheableImage(url) {
  if (isPublicImage(url.pathname)) return true;
  if (url.pathname !== '/_next/image') return false;
  const source = url.searchParams.get('url');
  if (!source || !source.startsWith('/') || source.startsWith('//')) return false;
  const original = new URL(source, self.location.origin);
  return original.origin === self.location.origin && !original.search && isPublicImage(original.pathname);
}

function isShortAudio(url) {
  if (url.search) return false;
  return SCENE_AUDIO.includes(url.pathname)
    || /^\/audio\/pinyin\/[a-z0-9]+\.mp3$/.test(url.pathname)
    || /^\/audio\/battle\/(?:hit|throw)\.wav$/.test(url.pathname)
    || /^\/audio\/battle\/types\/[a-z-]+\.wav$/.test(url.pathname);
}

function remember(cache, request, response, name, limit) {
  const previous = writes.get(name) ?? Promise.resolve();
  const pending = previous.catch(() => {}).then(async () => {
    await cache.put(request, response);
    const keys = await cache.keys();
    for (const key of keys.slice(0, Math.max(0, keys.length - limit))) await cache.delete(key);
  });
  writes.set(name, pending);
  return pending;
}

function imageKey(request) {
  const url = typeof request === 'string' ? request : request.url;
  const accept = typeof request === 'string' ? '' : request.headers.get('accept') ?? '';
  return `${url}\n${accept}`;
}

async function imageSize(response) {
  const declared = Number(response.headers.get('x-kanto-image-bytes') ?? response.headers.get('content-length'));
  return Number.isFinite(declared) && declared > 0 ? declared : (await response.blob()).size;
}

function rememberImage(cache, request, response) {
  const previous = writes.get(IMAGE_CACHE) ?? Promise.resolve();
  const pending = previous.catch(() => {}).then(async () => {
    const body = await response.blob();
    if (body.size > IMAGE_MAX_BYTES) return;
    const headers = new Headers(response.headers);
    headers.delete('content-encoding');
    headers.set('content-length', String(body.size));
    headers.set('x-kanto-image-bytes', String(body.size));
    await cache.put(request, new Response(body, { status: response.status, headers }));
    imageSizes.set(imageKey(request), body.size);
    const keys = await cache.keys();
    const live = new Set();
    let total = 0;
    for (const key of keys) {
      const id = imageKey(key);
      live.add(id);
      let size = imageSizes.get(id);
      if (size === undefined) {
        const saved = await cache.match(key);
        size = saved ? await imageSize(saved) : 0;
        imageSizes.set(id, size);
      }
      total += size;
    }
    for (const id of imageSizes.keys()) if (!live.has(id)) imageSizes.delete(id);
    while (keys.length > IMAGE_LIMIT || total > IMAGE_BUDGET) {
      const oldest = keys.shift();
      if (!oldest) break;
      const id = imageKey(oldest);
      await cache.delete(oldest);
      total -= imageSizes.get(id) ?? 0;
      imageSizes.delete(id);
    }
  });
  writes.set(IMAGE_CACHE, pending);
  return pending;
}

async function imageFallback(cache, request, url) {
  if (url.pathname !== '/_next/image') return null;
  const source = url.searchParams.get('url');
  if (!source) return null;
  const original = await cache.match(new URL(source, self.location.origin).href);
  if (original) return original;
  const width = Number(url.searchParams.get('w')) || 0;
  const candidates = (await cache.keys()).filter(key => {
    const stored = new URL(key.url);
    return stored.pathname === '/_next/image' && stored.searchParams.get('url') === source;
  }).sort((left, right) => {
    const score = key => {
      const candidate = Number(new URL(key.url).searchParams.get('w')) || 0;
      return candidate >= width ? candidate - width : width - candidate + 10_000;
    };
    return score(left) - score(right);
  });
  const accept = request.headers.get('accept') ?? '';
  for (const candidate of candidates) {
    const saved = await cache.match(candidate);
    const mime = saved?.headers.get('content-type')?.split(';')[0].toLowerCase();
    if (mime === 'image/avif' && !accept.includes('image/avif')) continue;
    if (mime === 'image/webp' && !accept.includes('image/webp')) continue;
    if (saved) return saved;
  }
  return null;
}

function respondWithStorage(event, work) {
  const storage = [];
  const response = work(promise => storage.push(promise));
  event.respondWith(response);
  // Register while the fetch event is dispatching; storage may finish after playback starts.
  event.waitUntil(response.then(() => Promise.all(storage), () => {}));
}

function validAudio(response) {
  return response.status === 200 && response.type === 'basic' && !response.redirected
    && response.headers.get('content-type')?.toLowerCase().startsWith('audio/');
}

async function rememberAudio(cache, url, response) {
  const declaredSize = Number(response.headers.get('content-length'));
  if (declaredSize > AUDIO_MAX_BYTES) return;
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > AUDIO_MAX_BYTES) return;
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-range');
  headers.set('content-length', String(bytes.byteLength));
  await remember(cache, url, new Response(bytes, { headers }), AUDIO_CACHE, AUDIO_LIMIT);
}

function warmAudio(cache, url) {
  const key = url.href;
  if (audioWarming.has(key)) return audioWarming.get(key);
  const pending = (async () => {
    if (await cache.match(key)) return;
    const response = await fetch(key, { credentials: 'same-origin', cache: 'no-cache' });
    if (validAudio(response)) await rememberAudio(cache, key, response);
  })().catch(() => {}).finally(() => audioWarming.delete(key));
  audioWarming.set(key, pending);
  return pending;
}

async function audioRange(response, range) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return null;
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const suffix = !match[1];
  const start = suffix ? Math.max(0, size - Number(match[2])) : Number(match[1]);
  const end = suffix ? size - 1 : match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  const headers = new Headers(response.headers);
  headers.set('accept-ranges', 'bytes');
  if (!size || start >= size || end < start || (suffix && !Number(match[2]))) {
    headers.set('content-range', `bytes */${size}`);
    headers.set('content-length', '0');
    return new Response(null, { status: 416, headers });
  }
  const part = bytes.slice(start, end + 1);
  headers.set('content-range', `bytes ${start}-${end}/${size}`);
  headers.set('content-length', String(part.byteLength));
  return new Response(part, { status: 206, headers });
}

async function shortAudioResponse(request, url, store) {
  let cache;
  try {
    cache = await caches.open(AUDIO_CACHE);
    const cached = await cache.match(url.href);
    if (cached) {
      const range = request.headers.get('range');
      if (!range || (request.headers.get('if-range') && ![cached.headers.get('etag'), cached.headers.get('last-modified')].includes(request.headers.get('if-range')))) return cached;
      const partial = await audioRange(cached, range);
      if (partial) return partial;
    }
  } catch { /* Storage may be unavailable; still play from the network. */ }
  try {
    const response = await fetch(request);
    if (cache && validAudio(response)) store(rememberAudio(cache, url.href, response.clone()).catch(() => {}));
    else if (cache && response.status === 206) {
      // Let the first streamed playback finish before downloading its complete copy.
      store(response.clone().arrayBuffer().then(() => warmAudio(cache, url)).catch(() => {}));
    }
    return response;
  } catch { return Response.error(); }
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  const current = [VERSION, IMAGE_CACHE, RESOURCE_CACHE, AUDIO_CACHE];
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kanto-public-') && !current.includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'warm-scene-audio') return;
  event.waitUntil(caches.open(AUDIO_CACHE).then(async cache => {
    for (const path of SCENE_AUDIO) await warmAudio(cache, new URL(path, self.location.origin));
  }).catch(() => {}));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/parent') || request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }
  if (isShortAudio(url)) {
    respondWithStorage(event, store => shortAudioResponse(request, url, store));
    return;
  }
  const image = isCacheableImage(url);
  const resource = url.pathname.startsWith('/_next/static/');
  if (!image && !resource) return;
  respondWithStorage(event, store => (async () => {
    const name = image ? IMAGE_CACHE : RESOURCE_CACHE;
    let cache;
    try {
      cache = await caches.open(name);
      const cached = await cache.match(request);
      if (cached) return cached;
    } catch { /* Storage may be unavailable; still fetch the resource. */ }
    try {
      const response = await fetch(request);
      const validImage = !image || response.headers.get('content-type')?.toLowerCase().startsWith('image/');
      if (image && cache && (!response.ok || !validImage)) {
        const fallback = await imageFallback(cache, request, url);
        if (fallback) return fallback;
      }
      if (cache && response.status === 200 && response.type === 'basic' && !response.redirected && validImage) {
        const save = image ? rememberImage(cache, request, response.clone()) : remember(cache, request, response.clone(), name, RESOURCE_LIMIT);
        store(save.catch(() => {}));
      }
      return response;
    } catch {
      if (image && cache) {
        try { const fallback = await imageFallback(cache, request, url); if (fallback) return fallback; } catch { /* Offline fallback is optional. */ }
      }
      return Response.error();
    }
  })());
});
