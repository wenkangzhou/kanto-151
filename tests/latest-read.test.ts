import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LatestRead} from '../src/lib/latest-read';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}
test('overlapping refreshes share one request and all callers wait for it', async () => {
  const gate = new LatestRead(), response = deferred<string>(), values: string[] = [];
  let calls = 0;
  const load = () => { calls++; return response.promise; };
  const first = gate.run(load, value => values.push(value), () => assert.fail());
  const second = gate.run(load, value => values.push(value), () => assert.fail());
  assert.equal(first, second);
  response.resolve('current');
  await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.deepEqual(values, ['current']);
});
test('late data cannot restore a lost device or overwrite a saved team', async () => {
  const gate = new LatestRead(), old = deferred<string>(), fresh = deferred<string>(), values: string[] = [];
  const first = gate.run(() => old.promise, value => values.push(value), () => assert.fail());
  const mutation = gate.token();
  gate.invalidate();
  assert.equal(gate.isCurrent(mutation), false);
  const second = gate.run(() => fresh.promise, value => values.push(value), () => assert.fail());
  fresh.resolve('new session');
  await second;
  old.resolve('old session');
  await first;
  assert.deepEqual(values, ['new session']);
});
test('stale failures stay silent and do not clear a newer pending request', async () => {
  const gate = new LatestRead(), old = deferred<string>(), fresh = deferred<string>();
  const first = gate.run(() => old.promise, () => assert.fail(), () => assert.fail());
  gate.invalidate();
  const second = gate.run(() => fresh.promise, () => {}, () => assert.fail());
  old.reject(new Error('old timeout'));
  await first;
  assert.equal(gate.run(() => Promise.resolve('duplicate'), () => assert.fail(), () => assert.fail()), second);
  fresh.resolve('new');
  await second;
});
test('a current failure is reported and a manual retry can succeed', async () => {
  const gate = new LatestRead(), values: string[] = [];
  await gate.run(() => Promise.reject(new Error('offline')), () => assert.fail(), error => values.push((error as Error).message));
  await gate.run(() => Promise.resolve('recovered'), value => values.push(value), () => assert.fail());
  assert.deepEqual(values, ['offline', 'recovered']);
});
test('invalidating a slow read cancels its transport, without surfacing stale errors', async () => {
  const gate = new LatestRead();
  let signal!: AbortSignal;
  const pending = gate.run(current => {
    signal = current;
    return new Promise((_,reject) => current.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
  },()=>assert.fail(),()=>assert.fail());
  await Promise.resolve();
  gate.invalidate();
  assert.equal(signal.aborted,true);
  await pending;
  const values:string[]=[];
  await gate.run(async current=>{assert.equal(current.aborted,false);return 'fresh';},value=>values.push(value),()=>assert.fail());
  assert.deepEqual(values,['fresh']);
});
test('invalidating before transport starts supplies an already-aborted signal',async()=>{
  const gate=new LatestRead();
  const pending=gate.run(async signal=>{assert.equal(signal.aborted,true);throw new Error('cancelled');},()=>assert.fail(),()=>assert.fail());
  gate.invalidate();
  await pending;
});
