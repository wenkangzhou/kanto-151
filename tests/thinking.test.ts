import {test} from 'node:test';
import assert from 'node:assert/strict';
import {thinkingQuestions,thinkingThemePool} from '../src/domain/thinking';
import {changeLearning,newLearning,type LearningState} from '../src/domain/learning';
const now=Date.parse('2026-10-12T04:00:00Z');
const act=(s:LearningState,input:Record<string,unknown>)=>changeLearning(s,{subject:'thinking',requestId:crypto.randomUUID(),...input},[25,1,7],false,now);
function answer(s:LearningState){const l=s.thinking!.active!,q=l.questions.find(q=>!q.done)!;return {action:'answer',lessonId:l.id,questionId:q.id,answer:q.target};}
test('thinking questions have unique solutions and use only collected partners',()=>{
 for(let n=0;n<100;n++)for(const ids of [[],[25],[25,25],[1,7,25]]){
  const qs=thinkingQuestions('round',ids,Math.random);assert.equal(qs.length,5);
  assert.equal(qs.filter(q=>q.kind==='different').length,2);
  for(const q of qs){assert.ok([...q.sequence,...q.options].filter(id=>id!==0).every(id=>id<0||ids.includes(id)));
   const target=q.options[Number(q.target)];
   if(q.kind==='pattern'){assert.equal(new Set(q.options).size,q.options.length);const full=q.sequence.map((id,i)=>i===q.blankIndex?target:id);assert.deepEqual(full.slice(0,q.groupSize),full.slice(q.groupSize));}
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

test('advanced stages have unique solutions, internal gaps and detail differences',()=>{
 for(const stage of [1,2])for(let n=0;n<100;n++){
  for(const q of thinkingQuestions('advanced',[1,7,25],Math.random,stage)){
   if(q.kind==='pattern'){
    assert.equal(q.options.length,3);const full=q.sequence.map((id,i)=>i===q.blankIndex?q.options[Number(q.target)]:id);
    assert.deepEqual(full.slice(0,q.groupSize),full.slice(q.groupSize));assert.equal(q.sequence.filter(id=>id===0).length,1);
    assert.ok(q.blankIndex!>=q.groupSize);
   }else{
    assert.equal(q.options.length,6);
    if(stage===2){assert.equal(new Set(q.options).size,1);assert.equal(q.marks!.filter(x=>x===q.marks![Number(q.target)]).length,1);}
   }
  }
 }
});
test('thinking advances after two strong rounds and parent fixed stage is respected',()=>{
 let s=newLearning();
 for(let round=0;round<2;round++){s=act(s,{action:'start'});while(!s.thinking!.active!.finishedAt)s=act(s,answer(s));}
 assert.equal(s.thinking!.stage,1);
 const settings={action:'settings',subject:'thinking',stage:2,fixed:true,requestId:crypto.randomUUID()};
 assert.throws(()=>changeLearning(s,settings,[],false,now));
 s=changeLearning(s,settings,[],true,now);s=act(s,{action:'start'});assert.equal(s.thinking!.active!.stage,2);assert.equal(s.thinking!.fixedStage,2);
 assert.equal(s.dailyRounds,2);
});

test('each round mixes three themed questions with two shape questions, even without partners',()=>{
 for(const ids of [[],[25],[25,7],[25,7,1]])for(let n=0;n<40;n++){
  const qs=thinkingQuestions('mixed',ids,Math.random,n%3);
  assert.equal(qs.filter(q=>q.options.every(id=>id>0||id<=-4)).length,3);
  assert.equal(qs.filter(q=>q.options.every(id=>id>=-3&&id<0)).length,2);
  assert.ok(qs.flatMap(q=>q.options).every(id=>id<0||ids.includes(id)));
 }
 assert.deepEqual(thinkingThemePool([]),[-4,-5,-6]);
 assert.deepEqual(thinkingThemePool([25]),[25,-4,-5]);
});
