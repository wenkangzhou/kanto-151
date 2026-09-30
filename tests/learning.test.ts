import {test} from 'node:test';
import assert from 'node:assert/strict';
import {changeLearning,newLearning,questionPool,type LearningState} from '../src/domain/learning';
import {defaultSlots,learnset,machineAvailable,starterMachines} from '../src/domain/battle-loadout';
const now=Date.parse('2026-09-29T02:00:00Z');
function action(s:LearningState,body:Record<string,unknown>,at=now){return changeLearning(s,{requestId:crypto.randomUUID(),...body},[104,105],false,at);}
function finish(s:LearningState){for(const q of s.active!.questions)s=action(s,{action:'answer',lessonId:s.active!.id,questionId:q.id,answer:q.a-q.b,seconds:10});return s;}
test('four stages contain valid distinct non-negative subtraction and defaults offer two legal machines',()=>{
 for(let stage=0;stage<4;stage++)for(const q of questionPool(stage)){assert.ok(q.a<=20&&q.a>=q.b&&q.b>0);if(stage===1)assert.ok(q.a>=10&&q.b<10&&q.a%10<q.b);if(stage===2)assert.ok(q.b>=10);}
 for(let id=1;id<=151;id++){const moves=starterMachines(id);assert.ok(moves.length<=2);assert.equal(new Set(moves).size,moves.length);for(const m of moves){assert.ok(learnset(id).machine.some(x=>x.id===m));assert.ok(machineAvailable(id,m));}}
});
test('correct, retry, hint and completion rewards persist and cannot double-credit',()=>{
 let s=action(newLearning(),{action:'start'});const q=s.active!.questions[0];const lessonId=s.active!.id;
 const body={action:'answer',lessonId,questionId:q.id,answer:q.a-q.b,requestId:crypto.randomUUID()};
 s=action(s,body);assert.equal(s.balance,2);assert.deepEqual(action(s,body),s);
 assert.throws(()=>action(s,{...body,requestId:crypto.randomUUID()}));
 const q2=s.active!.questions[1];s=action(s,{action:'hint',lessonId,questionId:q2.id});s=action(s,{action:'answer',lessonId,questionId:q2.id,answer:q2.a-q2.b});assert.equal(s.balance,3);
 const q3=s.active!.questions[2];s=action(s,{action:'answer',lessonId,questionId:q3.id,answer:20});s=action(s,{action:'answer',lessonId,questionId:q3.id,answer:q3.a-q3.b});assert.equal(s.balance,4);
 for(const q of s.active!.questions.filter(q=>!q.done))s=action(s,{action:'answer',lessonId,questionId:q.id,answer:q.a-q.b});
 assert.equal(s.balance,8);assert.equal(s.history.length,1);assert.ok(s.active!.finishedAt);
});
test('resume does not consume another round; reward cap, midnight and mastery progression',()=>{
 let s=action(newLearning(),{action:'start'});const id=s.active!.id;
 s=action(s,{action:'start'});assert.equal(s.active!.id,id);assert.equal(s.rounds,1);
 s=finish(s);s=finish(action(s,{action:'start'}));assert.equal(s.balance,20);assert.equal(s.stage,1);
 s=finish(action(s,{action:'start'}));assert.equal(s.balance,20);assert.equal(s.active!.rewarded,false);
 s=action(s,{action:'start'},now+86400000);assert.equal(s.rounds,1);assert.equal(s.active!.rewarded,true);
});
test('unlock is permanent, costs 30 once and validates ownership; settings require parent',()=>{
 let s=newLearning();const move=learnset(104).machine.find(m=>!starterMachines(104).includes(m.id))!.id;
 assert.throws(()=>action(s,{action:'unlock',pokemonId:104,moveId:move}),/学习星/);
 s.balance=29;assert.throws(()=>action(s,{action:'unlock',pokemonId:104,moveId:move}),/学习星/);
 const exact=action({...s,balance:30},{action:'unlock',pokemonId:104,moveId:move});assert.equal(exact.balance,0);
 s.balance=34;s=action(s,{action:'unlock',pokemonId:104,moveId:move});
 assert.equal(s.balance,4);assert.ok(machineAvailable(104,move,s.unlocked));s=action(s,{action:'unlock',pokemonId:104,moveId:move});assert.equal(s.balance,4);
 assert.throws(()=>action(s,{action:'unlock',pokemonId:150,moveId:move}));
 assert.throws(()=>action(s,{action:'settings',stage:0,dailyRounds:5}),/家长/);
 assert.ok(defaultSlots(104).slice(2).every(m=>m&&starterMachines(104).includes(m)));
});

test('five independent answers earn 10; four independent and one corrected earn 9',()=>{
 const perfect=finish(action(newLearning(),{action:'start'}));assert.equal(perfect.balance,10);
 let s=action(newLearning(),{action:'start'});const q=s.active!.questions[0];
 s=action(s,{action:'answer',lessonId:s.active!.id,questionId:q.id,answer:(q.a-q.b+1)%21});
 s=finish(s);assert.equal(s.balance,9);assert.equal(s.ledger.filter(r=>r.reason==='完成五题').length,0);
 assert.equal(s.active!.questions.reduce((sum,q)=>sum+q.stars,0),s.balance);
});
