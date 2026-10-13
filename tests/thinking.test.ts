import {test} from 'node:test';
import assert from 'node:assert/strict';
import {thinkingQuestions} from '../src/domain/thinking';
import {changeLearning,newLearning,type LearningState} from '../src/domain/learning';
const now=Date.parse('2026-10-12T04:00:00Z');
const act=(s:LearningState,input:Record<string,unknown>)=>changeLearning(s,{subject:'thinking',requestId:crypto.randomUUID(),...input},[25,1,7],false,now);
function answer(s:LearningState){const l=s.thinking!.active!,q=l.questions.find(q=>!q.done)!;return {action:'answer',lessonId:l.id,questionId:q.id,answer:q.target};}
test('thinking questions have unique solutions and use only collected partners',()=>{
 for(let n=0;n<100;n++)for(const ids of [[],[25],[25,25],[1,7,25]]){
  const qs=thinkingQuestions('round',ids,Math.random);assert.equal(qs.length,5);
  assert.equal(qs.filter(q=>q.kind==='different').length,2);
  for(const q of qs){assert.ok([...q.sequence,...q.options].every(id=>new Set(ids).size<2?id<0:ids.includes(id)));
   const target=q.options[Number(q.target)];
   if(q.kind==='pattern'){assert.equal(new Set(q.options).size,q.options.length);const full=[...q.sequence,target];assert.deepEqual(full.slice(0,q.groupSize),full.slice(q.groupSize));}
   else{assert.equal(q.options.filter(x=>x===target).length,1);assert.equal(new Set(q.options.filter(x=>x!==target)).size,1);}
  }
 }
});
test('thinking shares quotas, preserves other lessons and settles retries exactly once',()=>{
 let s=changeLearning(newLearning(),{action:'start',requestId:crypto.randomUUID()},[],false,now);const math=structuredClone(s.active);
 s=act(s,{action:'start'});const id=s.thinking!.active!.id;s=act(s,{action:'start'});assert.equal(s.thinking!.active!.id,id);assert.equal(s.rounds,2);
 const first=answer(s);s=act(s,{...first,answer:String(1-Number(first.answer))});s=act(s,first);assert.equal(s.balance,1);
 const second=answer(s);s=act(s,{...second,action:'hint'});s=act(s,second);assert.equal(s.balance,2);
 while(!s.thinking!.active!.finishedAt)s=act(s,answer(s));assert.equal(s.balance,8);assert.deepEqual(s.active,math);assert.equal(s.thinking!.history.length,1);
 s=act(s,{action:'start'});assert.equal(s.thinking!.active!.rewarded,false);s=act(s,answer(s));assert.equal(s.balance,8);
});
test('thinking batches are idempotent and reject forged answers',()=>{
 let s=act(newLearning(),{action:'start'});const event={...answer(s),subject:'thinking',requestId:crypto.randomUUID()};
 const batch={action:'batch',events:[event]};s=act(s,batch);assert.equal(s.balance,2);assert.deepEqual(act(s,batch),s);
 assert.throws(()=>act(s,{...answer(s),answer:'99'}));
 assert.throws(()=>act(s,{action:'settings'}));
});
