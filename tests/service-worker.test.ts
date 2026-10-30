import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import vm from 'node:vm';

test('initial offline cache stays small and includes the fallback image', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  let assets: string[] = [];
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; }, skipWaiting: () => {} },
    caches: { open: async () => ({ addAll: async (paths: string[]) => { assets = Array.from(paths); } }) },
  });
  let completion: Promise<unknown> | undefined;
  handlers.install({ waitUntil: (promise: Promise<unknown>) => { completion = promise; } });
  await completion;
  assert.ok(assets.includes('/offline.html'));
  assert.ok(assets.includes('/icons/icon-192.png'));
  assert.ok(assets.reduce((total, path) => total + statSync(`public${path}`).size, 0) < 100_000);
});

test('service worker excludes private routes, mutations, cross-origin and RSC requests', () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } }, URL,
  });
  const cases = [
    { url: 'https://kanto.test/api/session', method: 'GET' },
    { url: 'https://kanto.test/api/redeem', method: 'POST' },
    { url: 'https://kanto.test/parent/dashboard', method: 'GET' },
    { url: 'https://kanto.test/pokedex', method: 'POST' },
    { url: 'https://other.test/pokemon/1.png', method: 'GET' },
    { url: 'https://kanto.test/pokedex?_rsc=abc', method: 'GET' },
    { url: 'https://kanto.test/pokedex', method: 'GET', rsc: '1' },
    { url: 'https://kanto.test/_next/image?url=%2Fapi%2Fsession&w=256&q=75', method: 'GET', mode: 'cors' },
    { url: 'https://kanto.test/_next/image?url=https%3A%2F%2Fother.test%2Fimage.png&w=256&q=75', method: 'GET', mode: 'cors' },
  ];
  for (const request of cases) handlers.fetch({ request: { ...request, mode: request.mode ?? 'navigate', headers: { get: () => request.rsc } }, respondWith: () => assert.fail(`Intercepted excluded request ${request.url}`) });
});

test('HTML is never persisted; offline navigation uses the fallback; viewed artwork and optimized images are cached', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const saved = new Map<string, Response>([['/offline.html', new Response('offline page')]]);
  let offline = false;
  const keyOf = (key: string | { url: string }) => typeof key === 'string' ? key : key.url;
  const fakeCache = {
    match: async (key: string | { url: string }) => saved.get(keyOf(key))?.clone(),
    put: async (key: string | { url: string }, response: Response) => { saved.set(keyOf(key), response); },
    keys: async () => [...saved.keys()],
    delete: async (key: string | { url: string }) => saved.delete(keyOf(key)),
  };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, Response, caches: { open: async () => fakeCache, match: fakeCache.match },
    fetch: async (request: { mode: string }) => {
      if (offline) throw Error('offline');
      const response = new Response(request.mode === 'navigate' ? 'page with private state' : 'public artwork', { headers: { 'content-type': request.mode === 'navigate' ? 'text/html' : 'image/png' } });
      Object.defineProperty(response, 'type', { value: 'basic' });
      return response;
    },
  });
  async function visit(path: string, mode = 'navigate') {
    let result: Promise<Response> | undefined;
    const writes: Promise<unknown>[] = [];
    handlers.fetch({ request: { url: `https://kanto.test${path}`, method: 'GET', mode, headers: { get: () => null } }, respondWith: (promise: Promise<Response>) => { result = promise; }, waitUntil: (promise: Promise<unknown>) => { writes.push(promise); } });
    const response = await result;
    await Promise.all(writes);
    return response!.text();
  }
  assert.equal(await visit('/pokedex'), 'page with private state');
  assert.equal(saved.size, 1);
  assert.equal(await visit('/pokemon/1.png', 'cors'), 'public artwork');
  assert.equal(saved.size, 2);
  assert.equal(await visit('/logo-pokeball.png', 'cors'), 'public artwork');
  assert.equal(await visit('/encyclopedia/leaders/brock.png', 'cors'), 'public artwork');
  const optimized = '/_next/image?url=%2Fpokemon%2F1.png&w=256&q=75';
  assert.equal(await visit(optimized, 'cors'), 'public artwork');
  offline = true;
  assert.equal(await visit('/pokedex'), 'offline page');
  assert.equal(await visit('/pokemon/151'), 'offline page');
  assert.equal(await visit('/setup'), 'offline page');
  assert.equal(await visit('/logo-pokeball.png', 'cors'), 'public artwork');
  assert.equal(await visit('/pokemon/1.png', 'cors'), 'public artwork');
  assert.equal(await visit('/encyclopedia/leaders/brock.png', 'cors'), 'public artwork');
  assert.equal(await visit(optimized, 'cors'), 'public artwork');
});

test('public image cache is bounded and does not store an HTML response as an image', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const stores = new Map<string, Map<string, Response>>();
  const cache = (name: string) => {
    let store = stores.get(name);
    if (!store) { store = new Map(); stores.set(name, store); }
    return {
      match: async (request: { url: string }) => store.get(request.url)?.clone(),
      put: async (request: { url: string }, response: Response) => { store.set(request.url, response); },
      keys: async () => [...store.keys()],
      delete: async (key: string) => store.delete(key),
    };
  };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, Response, Map, caches: { open: async (name: string) => cache(name) },
    fetch: async (request: { url: string }) => {
      const html = request.url.endsWith('/pokemon/122.png');
      const response = new Response(html ? '<html>wrong response</html>' : 'public artwork', { headers: { 'content-type': html ? 'text/html' : 'image/png' } });
      Object.defineProperty(response, 'type', { value: 'basic' });
      return response;
    },
  });
  async function visit(path: string) {
    let result: Promise<Response> | undefined;
    const writes: Promise<unknown>[] = [];
    handlers.fetch({ request: { url: `https://kanto.test${path}`, method: 'GET', mode: 'cors', headers: { get: () => null } }, respondWith: (promise: Promise<Response>) => { result = promise; }, waitUntil: (promise: Promise<unknown>) => { writes.push(promise); } });
    await result;
    await Promise.all(writes);
  }
  for (let id = 1; id <= 122; id++) await visit(`/pokemon/${id}.png`);
  const images = stores.get('kanto-public-v5-images');
  assert.equal(images?.size, 120);
  assert.equal(images?.has('https://kanto.test/pokemon/1.png'), false);
  assert.equal(images?.has('https://kanto.test/pokemon/2.png'), true);
  assert.equal(images?.has('https://kanto.test/pokemon/121.png'), true);
  assert.equal(images?.has('https://kanto.test/pokemon/122.png'), false);
});

test('previously loaded static code is reused on a weak connection without caching page HTML', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const saved = new Map<string, Response>();
  let offline = false;
  let networkRequests = 0;
  const resourceCache = {
    match: async (request: { url: string }) => saved.get(request.url)?.clone(),
    put: async (request: { url: string }, response: Response) => { saved.set(request.url, response); },
    keys: async () => [...saved.keys()],
    delete: async (key: string) => saved.delete(key),
  };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, Response, Map, caches: { open: async () => resourceCache, match: async () => new Response('offline page') },
    fetch: async () => {
      networkRequests++;
      if (offline) throw Error('offline');
      const response = new Response('page code and fixed text', { headers: { 'content-type': 'text/javascript' } });
      Object.defineProperty(response, 'type', { value: 'basic' });
      return response;
    },
  });
  async function visit(path: string, mode: string) {
    let result: Promise<Response> | undefined;
    const writes: Promise<unknown>[] = [];
    handlers.fetch({ request: { url: `https://kanto.test${path}`, method: 'GET', mode, headers: { get: () => null } }, respondWith: (promise: Promise<Response>) => { result = promise; }, waitUntil: (promise: Promise<unknown>) => { writes.push(promise); } });
    const response = await result;
    await Promise.all(writes);
    return response?.text();
  }
  const bundle = '/_next/static/chunks/encyclopedia-abc.js';
  assert.equal(await visit(bundle, 'cors'), 'page code and fixed text');
  offline = true;
  assert.equal(await visit(bundle, 'cors'), 'page code and fixed text');
  assert.equal(networkRequests, 1);
  assert.equal(await visit('/pokedex', 'navigate'), 'offline page');
});

test('short audio is saved complete after a partial first play and serves offline ranges', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const saved = new Map<string, Response>();
  const audioCache = {
    match: async (key: string) => saved.get(key)?.clone(),
    put: async (key: string, response: Response) => { saved.set(key, response); },
    keys: async () => [...saved.keys()],
    delete: async (key: string) => saved.delete(key),
  };
  let offline = false;
  let requests = 0;
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, Response, Headers, caches: { open: async () => audioCache },
    fetch: async (request: Request | string) => {
      requests++;
      if (offline) throw Error('offline');
      const range = typeof request === 'string' ? null : request.headers.get('range');
      const response = new Response(range ? '0123' : '0123456789', { status: range ? 206 : 200, headers: { 'content-type': 'audio/mpeg' } });
      Object.defineProperty(response, 'type', { value: 'basic' });
      return response;
    },
  });
  async function play(range: string) {
    let result: Promise<Response> | undefined;
    const writes: Promise<unknown>[] = [];
    let dispatching = true;
    const request = new Request('https://kanto.test/audio/effects/evolution.mp3', { headers: { range } });
    handlers.fetch({ request, respondWith: (promise: Promise<Response>) => { result = promise; }, waitUntil: (promise: Promise<unknown>) => { assert.equal(dispatching, true); writes.push(promise); } });
    dispatching = false;
    const response = await result;
    await Promise.all(writes);
    return response!;
  }
  assert.equal(await (await play('bytes=0-3')).text(), '0123');
  assert.equal(requests, 2);
  assert.equal(saved.size, 1);
  offline = true;
  const middle = await play('bytes=4-7');
  assert.equal(middle.status, 206);
  assert.equal(middle.headers.get('content-range'), 'bytes 4-7/10');
  assert.equal(await middle.text(), '4567');
  assert.equal(await (await play('bytes=-3')).text(), '789');
  const outside = await play('bytes=10-');
  assert.equal(outside.status, 416);
  assert.equal(outside.headers.get('content-range'), 'bytes */10');
  assert.equal(requests, 2);
});

test('scene warmup, pinyin and battle cues are bounded to valid short audio', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const saved = new Map<string, Response>();
  const audioCache = {
    match: async (key: string) => saved.get(key)?.clone(),
    put: async (key: string, response: Response) => { saved.set(key, response); },
    keys: async () => [...saved.keys()],
    delete: async (key: string) => saved.delete(key),
  };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, Response, Headers, caches: { open: async () => audioCache },
    fetch: async (request: Request | string) => {
      const url = typeof request === 'string' ? request : request.url;
      const invalid = url.endsWith('/pinyin/a1.mp3');
      const large = url.endsWith('/battle/types/fire.wav');
      const response = new Response(large ? 'x'.repeat(1_000_001) : invalid ? '<html>wrong file</html>' : 'short audio', { headers: { 'content-type': invalid ? 'text/html' : 'audio/mpeg' } });
      Object.defineProperty(response, 'type', { value: 'basic' });
      return response;
    },
  });
  let warmup: Promise<unknown> | undefined;
  handlers.message({ data: { type: 'warm-scene-audio' }, waitUntil: (promise: Promise<unknown>) => { warmup = promise; } });
  await warmup;
  assert.equal(saved.size, 5);
  assert.ok(saved.has('https://kanto.test/audio/effects/evolution.mp3'));
  async function visit(path: string) {
    let result: Promise<Response> | undefined;
    const writes: Promise<unknown>[] = [];
    handlers.fetch({ request: new Request(`https://kanto.test${path}`), respondWith: (promise: Promise<Response>) => { result = promise; }, waitUntil: (promise: Promise<unknown>) => { writes.push(promise); } });
    await result;
    await Promise.all(writes);
  }
  await visit('/audio/pinyin/a1.mp3');
  await visit('/audio/battle/types/fire.wav');
  assert.equal(saved.size, 5);
  await visit('/audio/pinyin/ba1.mp3');
  await visit('/audio/battle/throw.wav');
  assert.ok(saved.has('https://kanto.test/audio/pinyin/ba1.mp3'));
  assert.ok(saved.has('https://kanto.test/audio/battle/throw.wav'));
  assert.equal(saved.size, 7);
  for (const path of ['/audio/battle/trainer.mp3', '/audio/sevii-islands-6-7.mp3', '/audio/voices/abc.mp3']) {
    handlers.fetch({ request: new Request(`https://kanto.test${path}`), respondWith: () => assert.fail(`Intercepted ${path}`) });
  }
});

test('upgrading removes the old HTML cache without deleting other applications caches', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const removed: string[] = []; let claimed = false;
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; }, clients: { claim: async () => { claimed = true; } } },
    caches: { keys: async () => ['kanto-public-v1', 'kanto-public-v2', 'kanto-public-v3', 'kanto-public-v4', 'kanto-public-v5', 'kanto-public-v5-images', 'kanto-public-v5-resources', 'kanto-public-v6', 'kanto-public-v6-audio', 'other-app'], delete: async (key: string) => { removed.push(key); } },
  });
  let completion: Promise<unknown> | undefined;
  handlers.activate({ waitUntil: (promise: Promise<unknown>) => { completion = promise; } });
  await completion;
  assert.deepEqual(removed, ['kanto-public-v1', 'kanto-public-v2', 'kanto-public-v3', 'kanto-public-v4', 'kanto-public-v5']);
  assert.equal(claimed, true);
});
