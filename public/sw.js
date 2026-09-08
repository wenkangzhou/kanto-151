/* Public browsing cache only. Never cache auth, API, parent pages or mutations. */
const VERSION = 'kanto-public-v1';
const SHELL = ['/offline.html', '/logo.png', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kanto-public-') && key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/parent') || request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;
  const staticAsset = /^\/(pokemon\/\d+\.png|icons\/[^/]+\.png|logo\.png|_next\/static\/.*)$/.test(url.pathname);
  const publicDocument = request.mode === 'navigate' && (/^\/(pokedex|bag|history)?$/.test(url.pathname) || /^\/pokemon\/\d+$/.test(url.pathname));
  if (!staticAsset && !publicDocument) {
    if (request.mode === 'navigate') event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const key = publicDocument ? url.pathname : request;
    if (staticAsset) {
      const cached = await cache.match(key);
      if (cached) return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic' && !response.redirected) {
        const copy = response.clone();
        event.waitUntil(cache.put(key, copy).catch(() => {}));
      }
      return response;
    } catch {
      return (await cache.match(key)) || (publicDocument ? await cache.match('/offline.html') : Response.error());
    }
  })());
});
