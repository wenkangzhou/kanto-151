import { test } from 'node:test';
import assert from 'node:assert/strict';
import { battleMoves, battleReducer, createBattle, damage, feedback, multiplier, opponentPool, pickOpponent, usableMoves, type BattleState } from '../src/domain/battle';
import pokemon from '../src/data/pokemon.json';
function completeStep(s: BattleState): BattleState {
  let next=battleReducer(s,{type:'advance'});
  if(next.phase==='player-feedback'||next.phase==='enemy-feedback')next=battleReducer(next,{type:'advance'});
  return next;
}
test('every partner has one to three locally cached moves',()=>{for(const p of pokemon){const moves=battleMoves(p.id);assert.ok(moves.length>=1&&moves.length<=3);for(const m of moves)assert.ok(m.name&&m.type);}});
test('dual type weaknesses, neutral fighting and immunity use the existing chart',()=>{assert.equal(multiplier({id:'x',name:'x',type:'electric'},16),2);assert.equal(multiplier({id:'x',name:'x',type:'fighting'},16),1);assert.equal(damage({id:'x',name:'x',type:'ground'},16),0);});
test('a turn cannot be double-clicked and the chosen partner is locked for the match',()=>{
  let s=createBattle([4,7],1);
  s=completeStep(battleReducer(s,{type:'choose',id:4}));
  assert.equal(battleReducer(s,{type:'choose',id:7}),s);
  const attack={type:'attack' as const,moveId:battleMoves(4)[0].id};
  s=battleReducer(s,attack);
  assert.equal(battleReducer(s,attack),s);
  assert.equal(battleReducer(s,{type:'choose',id:7}),s);
  s=completeStep(s);assert.equal(s.phase,'enemy');
  s=completeStep(s);assert.equal(s.phase,'ready');
  assert.equal(battleReducer(s,{type:'choose',id:7}),s);
  assert.equal(s.active,4);
});
test('victory ends the match without an extra enemy attack',()=>{let s=createBattle([4],1);s=battleReducer(s,{type:'choose',id:4});s=completeStep(s);s={...s,enemyHp:1};s=battleReducer(s,{type:'attack',moveId:battleMoves(4)[0].id});s=completeStep(s);assert.equal(s.result,'win');assert.equal(s.hp[4],100);assert.equal(completeStep(s),s);});
test('one exhausted partner ends the match even when all five substitutes are healthy',()=>{
  let s:BattleState={...createBattle([4,7,1,25,16,19],1),active:4,phase:'enemy',move:{id:'test',name:'test',type:'normal'}};
  s={...s,hp:{...s.hp,4:1}};
  s=battleReducer(s,{type:'advance'});
  assert.equal(s.phase,'enemy-feedback');assert.equal(s.hp[4],0);
  s=battleReducer(s,{type:'advance'});
  assert.equal(s.phase,'finished');assert.equal(s.result,'rest');
  for(const id of [7,1,25,16,19]) {assert.equal(s.hp[id],100);assert.equal(battleReducer(s,{type:'choose',id}),s);}
  assert.equal(completeStep(s),s);
  let rematch=createBattle(s.team,s.enemy);
  assert.equal(rematch.enemy,s.enemy);assert.equal(rematch.enemyHp,100);assert.equal(rematch.hp[4],100);
  rematch=battleReducer(rematch,{type:'choose',id:7});
  assert.equal(rematch.active,7);assert.equal(rematch.phase,'summon');
});
test('all immune matchups have a way forward and long matches end in a draw',()=>{for(const p of pokemon)for(const target of pokemon)assert.ok(usableMoves(p.id,target.id).some(m=>damage(m,target.id)>0));const s=completeStep({...createBattle([4],1),phase:'enemy',active:4,rounds:23,move:{id:'test',name:'test',type:'normal'}});assert.equal(s.result,'draw');});
test('opponents are known and restarting restores health',()=>{assert.deepEqual(opponentPool([4,4],[4]),[4]);assert.equal(createBattle([4,4],4).team.length,1);assert.equal(createBattle([4],4).hp[4],100);});

test('entry blocks attacks until the ball opens without spending an opening turn',()=>{let s=createBattle([4,7],1);s=battleReducer(s,{type:'choose',id:4});assert.equal(s.phase,'summon');assert.equal(battleReducer(s,{type:'attack',moveId:battleMoves(4)[0].id}),s);assert.equal(battleReducer(s,{type:'choose',id:7}),s);s=completeStep(s);assert.equal(s.phase,'ready');assert.equal(s.enemyHp,100);assert.equal(s.hp[4],100);});
test('resisted damage is not described as immunity',()=>{const fire={id:'ember',name:'火花',type:'fire' as const};assert.ok(damage(fire,7)>0);assert.equal(feedback(fire,7),'效果不显著。');const ground={id:'mud-slap',name:'掷泥',type:'ground' as const};assert.equal(damage(ground,16),0);assert.match(feedback(ground,16),/体力没有减少/);});

test('random opponent varies across the pool and excludes the current opponent',()=>{
  assert.equal(pickOpponent([1,4,7],1,0),4);
  assert.equal(pickOpponent([1,4,7],1,.99),7);
  assert.equal(pickOpponent([1],1,.5),1);
  assert.equal(pickOpponent([],undefined,.5),undefined);
  for(let i=0;i<100;i++)assert.notEqual(pickOpponent([1,4,7],4,i/100),4);
});

test('damage feedback is a separate locked stage before the opponent acts',()=>{
  let s=completeStep(battleReducer(createBattle([4,7],1),{type:'choose',id:4}));
  s=battleReducer(s,{type:'attack',moveId:battleMoves(4)[0].id});
  s=battleReducer(s,{type:'advance'});
  assert.equal(s.phase,'player-feedback');assert.ok(s.enemyHp<100);assert.equal(s.hp[4],100);
  assert.equal(battleReducer(s,{type:'attack',moveId:battleMoves(4)[0].id}),s);
  assert.equal(battleReducer(s,{type:'choose',id:7}),s);
  s=battleReducer(s,{type:'advance'});assert.equal(s.phase,'enemy');
  s=battleReducer(s,{type:'advance'});assert.equal(s.phase,'enemy-feedback');assert.equal(s.rounds,0);
  s=battleReducer(s,{type:'advance'});assert.equal(s.phase,'ready');assert.equal(s.rounds,1);
});
