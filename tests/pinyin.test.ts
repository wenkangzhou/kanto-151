import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {changeLearning,newLearning,learningState,type LearningState} from '../src/domain/learning';
import {pinyinQuestions,pinyinById,pinyinItems,pinyinStages,pinyinPool,pinyinInitialAudio} from '../src/domain/pinyin';
import {LearningSession} from '../src/lib/learning-session';
const now=Date.parse('2026-10-12T04:00:00Z');
const act=(s:LearningState,input:Record<string,unknown>,time=now)=>changeLearning(s,{subject:'pinyin',requestId:crypto.randomUUID(),...input},[],false,time);
function nextAnswer(s:LearningState){const l=s.pinyin!.active!,q=l.questions.find(q=>!q.done)!;return {action:'answer',subject:'pinyin',requestId:crypto.randomUUID(),lessonId:l.id,questionId:q.id,answer:q.target};}
function finish(s:LearningState){while(s.pinyin!.active!.questions.some(q=>!q.done))s=act(s,nextAnswer(s));return s;}
test('expanded catalog has all three activities, legal unique options, and matching local audio',()=>{
 for(let stage=0;stage<pinyinStages.length;stage++)for(const random of [()=>0,()=>.99999,Math.random]){
  const qs=pinyinQuestions(stage,'lesson',random);assert.equal(qs.length,5);assert.equal(new Set(qs.map(q=>q.kind)).size,3);
  for(const q of qs){assert.equal(new Set(q.options).size,3);assert.ok(q.options.includes(q.target));for(const id of q.options)assert.ok(pinyinById.has(id));if(stage<2)assert.ok(q.options.every(id=>pinyinById.get(id)!.initial===(stage===0?'m':'b')));}
 }
 for(const item of pinyinItems)for(const audio of [item.id,item.finalAudio,pinyinInitialAudio[item.initial]])assert.ok(existsSync(`public/audio/pinyin/${audio}.mp3`));
 assert.match(readFileSync('public/audio/pinyin/LICENSE.txt','utf8'),/public domain/);
});
test('legacy math state and active lesson survive separate pinyin progress',()=>{
 let s=changeLearning(learningState(null),{action:'start',requestId:crypto.randomUUID()},[],false,now);
 const math=structuredClone(s.active);s=act(s,{action:'start'});assert.deepEqual(s.active,math);assert.equal(s.rounds,2);
 s=finish(s);assert.equal(s.balance,10);assert.deepEqual(s.active,math);assert.equal(s.stage,0);
 const completed=s.pinyin!.active!.id;s=act(s,{action:'start'});assert.notEqual(s.pinyin!.active!.id,completed);assert.equal(s.pinyin!.active!.rewarded,false);s=finish(s);assert.equal(s.balance,10);
});
test('pinyin retry and hint earn one, batches are atomic and idempotent',()=>{
 let s=act(newLearning(),{action:'start'});const first=nextAnswer(s),q=s.pinyin!.active!.questions[0];
 s=act(s,{...first,answer:q.options.find(id=>id!==q.target)});s=act(s,{...first,requestId:crypto.randomUUID()});assert.equal(s.balance,1);
 const second=nextAnswer(s),hint={...second,action:'hint'};
 const batch={action:'batch',events:[hint,{...second,requestId:crypto.randomUUID()}]};s=act(s,batch);assert.equal(s.balance,2);assert.deepEqual(act(s,batch),s);
 const before=structuredClone(s);assert.throws(()=>act(s,{action:'batch',events:[nextAnswer(s),{...nextAnswer(s),requestId:crypto.randomUUID(),questionId:'forged'}]}));assert.deepEqual(s,before);
 s=finish(s);assert.equal(s.balance,8);assert.equal(s.pinyin!.history.length,1);
 assert.throws(()=>act(s,{...nextAnswer({...s,pinyin:{...s.pinyin!,active:{...s.pinyin!.active!,questions:[{...q,done:false}]}}}),answer:'invalid'}));
});
test('pinyin stage settings require parent and never alter math or daily quota',()=>{
 let s=act(newLearning(),{action:'start'});assert.throws(()=>act(s,{action:'settings',stage:1,fixed:true}),/家长/);
 s=changeLearning(s,{action:'settings',subject:'pinyin',stage:1,fixed:true,requestId:crypto.randomUUID()},[],true,now);
 assert.equal(s.pinyin!.fixedStage,1);assert.equal(s.pinyin!.active!.stage,0);assert.equal(s.stage,0);assert.equal(s.dailyRounds,2);
 s=finish(s);s=act(s,{action:'start'});assert.equal(s.pinyin!.active!.stage,1);
 assert.throws(()=>act(s,{action:'start',subject:'english'}),/科目/);
});
test('cross-day resume keeps old eligibility; pinyin mastery advances independently',()=>{
 let s=act(newLearning(),{action:'start'});const id=s.pinyin!.active!.id;
 s=act(s,{action:'start'},now+86400000);assert.equal(s.pinyin!.active!.id,id);assert.equal(s.rounds,0);
 s=finish(s);s=finish(act(s,{action:'start'}));assert.equal(s.pinyin!.stage,1);assert.equal(s.stage,0);
});
test('pinyin local journal restores after a lost batch response, without duplicate rewards',async()=>{
 let server=act(newLearning(),{action:'start'}),lose=true;
 const disk=new Map<string,Record<string,unknown>>();
 const request=async(body?:Record<string,unknown>)=>{if(!body)return {...server,syncScope:'test-device'};server=changeLearning(server,body,[]);if(lose){lose=false;throw Error('response lost');}return server;};
 const journal={read:()=>[...disk.values()],put:(_:string,e:Record<string,unknown>)=>{disk.set(String(e.requestId),e);},remove:(_:string,e:Record<string,unknown>)=>{disk.delete(String(e.requestId));}};
 const session=new LearningSession(request,journal);await session.load();session.apply(nextAnswer(server));assert.equal(session.getSnapshot().data!.balance,2);await session.flush();assert.equal(disk.size,1);session.dispose();
 const restored=new LearningSession(request,journal);await restored.load();await restored.flush();assert.equal(server.balance,2);assert.equal(disk.size,0);
 const resumed=await restored.start({action:'start',subject:'pinyin',requestId:crypto.randomUUID()});assert.equal(resumed.pinyin!.active!.id,server.pinyin!.active!.id);restored.dispose();
});

test('reward and math settings save independently and require a parent',()=>{
 let s=newLearning();s.stage=2;s.fixedStage=2;
 const rewards={action:'settings',scope:'rewards',dailyRounds:4,requestId:crypto.randomUUID()};
 assert.throws(()=>changeLearning(s,rewards,[],false,now));
 s=changeLearning(s,rewards,[],true,now);
 assert.equal(s.dailyRounds,4);assert.equal(s.stage,2);assert.equal(s.fixedStage,2);
 s=changeLearning(s,{action:'settings',scope:'math',stage:1,fixed:false,requestId:crypto.randomUUID()},[],true,now);
 assert.equal(s.dailyRounds,4);assert.equal(s.stage,1);assert.equal(s.fixedStage,null);
 assert.throws(()=>changeLearning(s,{...rewards,dailyRounds:6,requestId:crypto.randomUUID()},[],true,now));
});

 test('appended stages preserve old pools and cover every new syllable',()=>{
  assert.deepEqual(pinyinPool(0).map(x=>x.id),['ma1','mi3','mu4']);
  assert.deepEqual(pinyinPool(1).map(x=>x.id),['ba1','bi3','bu4']);
  assert.equal(pinyinPool(2).length,6);
  assert.equal(pinyinPool(5).length,12);
  assert.equal(pinyinPool(7).length,15);
  for(let stage=0;stage<pinyinStages.length;stage++){
   const pool=new Set(pinyinPool(stage).map(x=>x.id));
   for(let run=0;run<30;run++)for(const q of pinyinQuestions(stage,'lesson',Math.random)){
    assert.ok(pool.has(q.target));assert.ok(q.options.every(id=>pool.has(id)));
   }
  }
 });
 test('mastery continues beyond legacy cap, preserves unfinished lessons, and stops at final stage',()=>{
  for(const stage of [2,3,4,5,6,7]){
   let s=newLearning();s.pinyin={stage,fixedStage:null,active:null,history:[]};
   s=finish(act(s,{action:'start'}));s=finish(act(s,{action:'start'}));
   assert.equal(s.pinyin!.stage,Math.min(stage+1,pinyinStages.length-1));
   assert.equal(s.balance,20);assert.equal(s.rounds,2);
  }
  let s=act(newLearning(),{action:'start'});const old=structuredClone(s.pinyin!.active);
  s=changeLearning(s,{action:'settings',subject:'pinyin',stage:6,fixed:true,requestId:crypto.randomUUID()},[],true,now);
  assert.deepEqual(s.pinyin!.active,old);
  s=finish(s);s=act(s,{action:'start'});assert.equal(s.pinyin!.active!.stage,6);
  s=finish(s);assert.equal(s.pinyin!.stage,6);
  for(const stage of [-1,8,1.5])assert.throws(()=>changeLearning(s,{action:'settings',subject:'pinyin',stage,requestId:crypto.randomUUID()},[],true,now));
 });
