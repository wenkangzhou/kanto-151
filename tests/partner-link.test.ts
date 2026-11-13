import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveFromQuery,partnerFromQuery} from '../src/domain/partner-link';

test('battle and team links accept one valid partner id only',()=>{
 assert.equal(partnerFromQuery('25'),25);
 for(const input of [undefined,['25','26'],'0','-1','25abc','1.5','9007199254740992'] as const){
  assert.equal(partnerFromQuery(input),undefined);
 }
});
test('practice move links accept one safe move id',()=>{
 assert.equal(moveFromQuery('thunderbolt'),'thunderbolt');
 for(const input of [undefined,['thunderbolt','tackle'],'','../team','move?partner=1','a'.repeat(81)] as const){
  assert.equal(moveFromQuery(input),undefined);
 }
});
