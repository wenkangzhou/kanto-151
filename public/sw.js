/* Only public static assets are cached. Family data and HTML are always online. */
const VERSION = 'kanto-public-v2';
const SHELL = ['/offline.html', '/logo.png', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
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
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }
  if (!staticAsset) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic' && !response.redirected) event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      return response;
    } catch { return Response.error(); }
  })());
});
