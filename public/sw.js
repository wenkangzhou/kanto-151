/* Only public static assets are cached. Family data and HTML are always online.
   Bump VERSION when public artwork changes so old images are replaced. */
const VERSION = 'kanto-public-v5';
const IMAGE_CACHE = `${VERSION}-images`;
const RESOURCE_CACHE = `${VERSION}-resources`;
const IMAGE_LIMIT = 120;
const RESOURCE_LIMIT = 120;
const SHELL = ['/offline.html', '/icons/icon-192.png'];
const writes = new Map();

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

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  const current = [VERSION, IMAGE_CACHE, RESOURCE_CACHE];
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kanto-public-') && !current.includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
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
  const image = isCacheableImage(url);
  const resource = url.pathname.startsWith('/_next/static/');
  if (!image && !resource) return;
  event.respondWith((async () => {
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
      if (cache && response.ok && response.type === 'basic' && !response.redirected && validImage) {
        event.waitUntil(remember(cache, request, response.clone(), name, image ? IMAGE_LIMIT : RESOURCE_LIMIT).catch(() => {}));
      }
      return response;
    } catch { return Response.error(); }
  })());
});
