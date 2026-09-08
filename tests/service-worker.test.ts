import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('service worker excludes private routes, mutations, cross-origin and RSC requests', () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL,
  });
  const cases = [
    { url: 'https://kanto.test/api/redeem', method: 'GET' },
    { url: 'https://kanto.test/parent/dashboard', method: 'GET' },
    { url: 'https://kanto.test/pokedex', method: 'POST' },
    { url: 'https://other.test/pokemon/1.png', method: 'GET' },
    { url: 'https://kanto.test/pokedex?_rsc=abc', method: 'GET' },
    { url: 'https://kanto.test/pokedex', method: 'GET', rsc: '1' },
  ];
  for (const request of cases) handlers.fetch({ request: { ...request, mode: 'navigate', headers: { get: () => request.rsc } }, respondWith: () => assert.fail(`Intercepted excluded request ${request.url}`) });
});

test('service worker saves public HTML for offline use and supplies an offline fallback', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const saved = new Map<string, Response>();
  saved.set('/offline.html', new Response('offline page'));
  let offline = false;
  const fakeCache = { match: async (key: string) => saved.get(key)?.clone(), put: async (key: string, response: Response) => { saved.set(key, response); } };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://kanto.test' }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, Response,
    caches: { open: async () => fakeCache },
    fetch: async () => { if (offline) throw Error('offline'); const response = new Response('public pokedex'); Object.defineProperty(response, 'type', { value: 'basic' }); return response; },
  });
  async function navigate(path: string) {
    let result: Promise<Response> | undefined;
    const writes: Promise<unknown>[] = [];
    handlers.fetch({ request: { url: `https://kanto.test${path}`, method: 'GET', mode: 'navigate', headers: { get: () => null } }, respondWith: (promise: Promise<Response>) => { result = promise; }, waitUntil: (promise: Promise<unknown>) => { writes.push(promise); } });
    const response = await result;
    await Promise.all(writes);
    return response!.text();
  }
  assert.equal(await navigate('/pokedex'), 'public pokedex');
  offline = true;
  assert.equal(await navigate('/pokedex'), 'public pokedex');
  assert.equal(await navigate('/pokemon/151'), 'offline page');
});
