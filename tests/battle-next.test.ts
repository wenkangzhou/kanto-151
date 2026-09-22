import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNextBattle,maxHp} from '../src/domain/battle';
import {TYPE_NAMES} from '../src/domain/types';
test('next challenge keeps the partner but restores HP, clears battle history and recalculates order',()=>{
 const next=createNextBattle([25,7],95,25,.5);
 assert.equal(next.active,25);assert.equal(next.phase,'summon');assert.equal(next.hp[25],maxHp(25));assert.equal(next.enemyHp,maxHp(95));
 assert.equal(next.first,'player');assert.equal(next.rounds,0);assert.equal(next.lastHit,undefined);assert.equal(next.moment,undefined);assert.equal(next.message,'大岩蛇');
 assert.equal(createNextBattle([7],25,7,.5).first,'enemy');
});
test('removed or unselected partners return to choosing normally',()=>{
 assert.equal(createNextBattle([7],95,25).phase,'choose');
 assert.equal(createNextBattle([7],95).active,null);
});
test('every type has a short non-silent local WAV cue',()=>{
 for(const type of Object.keys(TYPE_NAMES)){
  const wav=readFileSync(`public/audio/battle/types/${type}.wav`);
  assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');
  const seconds=wav.readUInt32LE(40)/wav.readUInt32LE(28);assert.ok(seconds>0&&seconds<.7);assert.ok(wav.subarray(44).some(byte=>byte!==0));
 }
});
