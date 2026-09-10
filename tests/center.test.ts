import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centerPartners } from '../src/domain/center';
import type { CollectionRecord } from '../src/domain/types';
const records: CollectionRecord[] = [
  {pokemonId:16,acquiredAt:'2026-09-01T00:00:00Z',method:'capture',reason:''},
  {pokemonId:4,acquiredAt:'2026-09-03T00:00:00Z',method:'capture',reason:''},
  {pokemonId:1,acquiredAt:'2026-09-02T00:00:00Z',method:'capture',reason:''},
];
test('center filters either dual type, excludes travelling members and leaves records untouched',()=>{
  const before=structuredClone(records);
  assert.deepEqual(centerPartners(records,[], 'flying','recent').map(r=>r.pokemonId),[16]);
  assert.deepEqual(centerPartners(records,[], 'normal','recent').map(r=>r.pokemonId),[16]);
  assert.deepEqual(centerPartners(records,[16], 'flying','recent'),[]);
  assert.deepEqual(centerPartners(records,[], 'water','recent'),[]);
  assert.deepEqual(centerPartners(records,[4], 'all','recent').map(r=>r.pokemonId),[1,16]);
  assert.deepEqual(records,before);
});
test('center orders by acquisition time or dex number, with deterministic ties',()=>{
  assert.deepEqual(centerPartners(records,[], 'all','recent').map(r=>r.pokemonId),[4,1,16]);
  assert.deepEqual(centerPartners(records,[], 'all','number').map(r=>r.pokemonId),[1,4,16]);
  assert.deepEqual(centerPartners(records.map(r=>({...r,acquiredAt:records[0].acquiredAt})),[], 'all','recent').map(r=>r.pokemonId),[1,4,16]);
});
