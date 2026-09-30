import {test} from 'node:test';
import assert from 'node:assert/strict';
import {subtractionHelp} from '../src/domain/subtraction-help';
test('15 minus 7 keeps five aside, takes seven from ten, then combines',()=>{
 const steps=subtractionHelp(15,7);
 assert.deepEqual(steps.map(s=>s.equation),['15 = 10 + 5','10 − 7 = 3','3 + 5 = 8']);
 assert.deepEqual(steps[1].groups,[{total:10,removed:7,label:'剩 3'},{total:5,removed:0,label:'5'}]);
});
test('16 minus 13 splits the subtrahend too',()=>{
 assert.deepEqual(subtractionHelp(16,13).map(s=>s.equation),['16 = 10 + 6；13 = 10 + 3','16 − 10 = 6','6 − 3 = 3']);
});
test('all supported subtractions end with the correct number of visible counters',()=>{
 for(let a=1;a<=20;a++)for(let b=1;b<=a;b++){
  const steps=subtractionHelp(a,b);
  for(const s of steps)for(const g of s.groups)assert.ok(g.total>=g.removed&&g.removed>=0,`${a}-${b}`);
  assert.equal(steps.at(-1)!.groups.reduce((sum,g)=>sum+g.total-g.removed,0),a-b,`${a}-${b}`);
 }
});
