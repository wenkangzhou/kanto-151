import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
  ];
  for (const request of cases) handlers.fetch({ request: { ...request, mode: 'navigate', headers: { get: () => request.rsc } }, respondWith: () => assert.fail(`Intercepted excluded request ${request.url}`) });
});

test('HTML is never persisted; offline navigation uses only the generic fallback; static artwork is cached', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const saved = new Map<string, Response>([['/offline.html', new Response('offline page')]]);
  let offline = false;
  const keyOf = (key: string | { url: string }) => typeof key === 'string' ? key : key.url;
  const fakeCache = {
    match: async (key: string | { url: string }) => saved.get(keyOf(key))?.clone(),
    put: async (key: string | { url: string }, response: Response) => { saved.set(keyOf(key), response); },
  };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, Response, caches: { open: async () => fakeCache, match: fakeCache.match },
    fetch: async (request: { mode: string }) => {
      if (offline) throw Error('offline');
      const response = new Response(request.mode === 'navigate' ? 'page with private state' : 'public artwork');
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
  offline = true;
  assert.equal(await visit('/pokedex'), 'offline page');
  assert.equal(await visit('/pokemon/151'), 'offline page');
  assert.equal(await visit('/setup'), 'offline page');
  assert.equal(await visit('/logo-pokeball.png', 'cors'), 'public artwork');
  assert.equal(await visit('/pokemon/1.png', 'cors'), 'public artwork');
});

test('upgrading removes the old HTML cache without deleting other applications caches', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const removed: string[] = []; let claimed = false;
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; }, clients: { claim: async () => { claimed = true; } } },
    caches: { keys: async () => ['kanto-public-v1', 'kanto-public-v2', 'kanto-public-v3', 'other-app'], delete: async (key: string) => { removed.push(key); } },
  });
  let completion: Promise<unknown> | undefined;
  handlers.activate({ waitUntil: (promise: Promise<unknown>) => { completion = promise; } });
  await completion;
  assert.deepEqual(removed, ['kanto-public-v1', 'kanto-public-v2']);
  assert.equal(claimed, true);
});
