import { test } from 'node:test';
import assert from 'node:assert/strict';
import { battleRules, battleMoves, defaultSlots, learnset, resolvedSlots, validSlots } from '../src/domain/battle-loadout';
import { battleReducer, createBattle, createNextBattle } from '../src/domain/battle';
import { createDemoData, handleDemo } from '../src/lib/demo-api';

test('all 151 default presets respect USUM level-50 3+1 slots and contain no duplicates',()=>{
  assert.equal(battleRules.versionGroupId,18);assert.equal(battleRules.level,50);
  for(let id=1;id<=151;id++){
    assert.ok(validSlots(id,defaultSlots(id)),String(id));
    assert.deepEqual(resolvedSlots(id),defaultSlots(id));
    assert.ok(learnset(id).level.every(m=>m.level!==undefined&&m.level<=50));
    assert.ok(battleMoves(id).length<=4);
  }
  assert.ok(learnset(104).level.some(m=>m.id==='bone-club'));
  assert.ok(!learnset(104).machine.some(m=>m.id==='water-gun'));
  assert.deepEqual(defaultSlots(11),[null,null,null,null]);
  assert.equal(battleMoves(11)[0].id,'struggle');
  assert.equal(battleMoves(63).length,1);
});
test('cross-source moves, repeated moves, foreign moves and malformed presets are rejected',()=>{
  const slots=defaultSlots(104);
  assert.ok(!validSlots(104,[slots[0],slots[0],slots[2],slots[3]]));
  assert.ok(!validSlots(104,['ice-beam',slots[1],slots[2],slots[3]]));
  assert.ok(!validSlots(104,[slots[0],slots[1],slots[2],'water-gun']));
  assert.ok(!validSlots(104,[slots[0]]));assert.ok(!validSlots(999,slots));
  const old=['water-gun','bone-club','struggle','teleport'];
  const repaired=resolvedSlots(104,old);
  assert.equal(repaired[1],'bone-club');assert.ok(validSlots(104,repaired));
});
test('battle freezes custom player moves, enemy stays default, unequipped moves cannot be used',()=>{
  const custom=defaultSlots(104);const alternative=learnset(104).level.find(m=>!custom.includes(m.id))!;
  const removed=custom[0]!;custom[0]=alternative.id;
  const presets={104:custom};let state=createBattle([104],104,presets);
  presets[104]=defaultSlots(104);
  state=battleReducer(state,{type:'choose',id:104,tieRandom:0});
  state=battleReducer(state,{type:'advance'});state=battleReducer(state,{type:'advance'});
  assert.equal(state.phase,'ready');
  assert.equal(battleReducer(state,{type:'attack',moveId:removed}),state);
  assert.equal(battleReducer(state,{type:'attack',moveId:alternative.id}).move?.id,alternative.id);
  const next=createNextBattle([104],4,104,0,{104:custom});
  assert.equal(next.presets[104][0],alternative.id);assert.equal(next.phase,'summon');
});
test('demo presets persist through session, enforce ownership, reject stale edits and reset independently',()=>{
  const demo=createDemoData();const slots=defaultSlots(104);
  handleDemo(demo,'battle/moves',{pokemonId:104,moves:slots,expected:null});
  assert.deepEqual(demo.snapshot.movePresets?.[104],slots);
  assert.doesNotThrow(()=>handleDemo(demo,'battle/moves',{pokemonId:104,moves:slots,expected:null}));
  const changed=[...slots];changed[0]=learnset(104).level.find(m=>!slots.includes(m.id))!.id;
  assert.throws(()=>handleDemo(demo,'battle/moves',{pokemonId:104,moves:changed,expected:null}),/变化/);
  assert.throws(()=>handleDemo(demo,'battle/moves',{pokemonId:150,moves:defaultSlots(150),expected:null}),/已收集/);
  handleDemo(demo,'battle/moves',{pokemonId:104,moves:changed,expected:slots});
  assert.deepEqual(demo.snapshot.movePresets?.[104],changed);
  assert.equal(createDemoData().snapshot.movePresets,undefined);
});
