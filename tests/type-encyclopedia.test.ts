import {test} from 'node:test';
import assert from 'node:assert/strict';
import {guideTypes,guideEffectiveness,matchupNarration} from '../src/domain/type-encyclopedia';
import {effectiveness} from '../src/domain/effectiveness';

test('FRLG has 17 types and preserves its two Steel resistances without changing modern battles',()=>{
 assert.equal(guideTypes.length,17);
 assert.equal(new Set(guideTypes).size,17);
 assert.ok(!guideTypes.some(t=>(t as string)==='fairy'));
 for(const a of guideTypes)for(const d of guideTypes){
  const expected=d==='steel'&&(a==='ghost'||a==='dark')?.5:effectiveness(a,[d]);
  assert.equal(guideEffectiveness(a,[d]),expected,`${a} → ${d}`);
 }
 assert.equal(effectiveness('ghost',['steel']),1);
 assert.equal(effectiveness('dark',['steel']),1);
});
test('attack direction, immunities and dual-type multiplication',()=>{
 assert.equal(guideEffectiveness('water',['fire']),2);
 assert.equal(guideEffectiveness('fire',['water']),.5);
 assert.equal(guideEffectiveness('electric',['water','flying']),4);
 assert.equal(guideEffectiveness('grass',['fire','flying']),.25);
 assert.equal(guideEffectiveness('electric',['ground','flying']),0);
 assert.equal(guideEffectiveness('ground',['electric','flying']),0);
 assert.equal(guideEffectiveness('normal',['ghost']),0);
 assert.equal(guideEffectiveness('fighting',['ghost']),0);
 assert.equal(guideEffectiveness('poison',['steel']),0);
 assert.equal(guideEffectiveness('psychic',['dark']),0);
 assert.equal(guideEffectiveness('ghost',['normal']),0);
 assert.equal(guideEffectiveness('water',['fire','fire']),2);
 for(const a of guideTypes)for(const d of guideTypes)for(const e of guideTypes.filter(t=>t!==d)){
  assert.equal(guideEffectiveness(a,[d,e]),guideEffectiveness(a,[d])*guideEffectiveness(a,[e]));
 }
});
test('speech explains normal, zero and fractional results without reversing attack and defense',()=>{
 assert.match(matchupNarration('water',['fire']),/水属性招式，打中火属性.*2倍/);
 assert.match(matchupNarration('electric',['ground','flying']),/没有效果/);
 assert.match(matchupNarration('grass',['fire','flying']),/四分之一/);
 assert.match(matchupNarration('fire',['water']),/一半/);
 assert.match(matchupNarration('water',['normal']),/效果正常/);
});
