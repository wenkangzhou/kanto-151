import test from 'node:test';
import assert from 'node:assert/strict';
import {changeLearning,newLearning,type LearningState} from '../src/domain/learning';
import {LearningSession} from '../src/lib/learning-session';
const start=()=>changeLearning(newLearning(),{action:'start',requestId:crypto.randomUUID()},[]);
const answer=(s:LearningState)=>{const q=s.active!.questions.find(q=>!q.done)!;return {action:'answer',requestId:crypto.randomUUID(),lessonId:s.active!.id,questionId:q.id,answer:q.a-q.b};};
test('batch is atomic, deduplicated, and cannot include rewards/settings/start/unlock',()=>{
 const s=start(),one=answer(s),next=changeLearning(s,one,[]),two=answer(next);
 const batch={action:'batch',events:[one,two]};
 const result=changeLearning(s,batch,[]);assert.equal(result.balance,4);
 assert.deepEqual(changeLearning(result,batch,[]),result);
 for(const action of ['start','settings','unlock','batch'])assert.throws(()=>changeLearning(s,{action:'batch',events:[one,{action}]},[]));
 assert.equal(s.balance,0);
 assert.throws(()=>changeLearning(s,{action:'batch',events:[]},[]));
 assert.throws(()=>changeLearning(s,{action:'batch',events:Array(21).fill(one)},[]));
});
test('slow network does not block answers; new answers during flush are preserved',async()=>{
 let server=start(),release!:()=>void,posts=0;
 const disk=new Map<string,Record<string,unknown>>();
 const session=new LearningSession(async body=>{
  if(!body)return {...server,syncScope:'child:device'};
  posts++;if(posts===1)await new Promise<void>(resolve=>release=resolve);
  server=changeLearning(server,body,[]);return server;
 },{read:()=>[...disk.values()],put:(_,e)=>{disk.set(String(e.requestId),e);},remove:(_,e)=>{disk.delete(String(e.requestId));}});
 await session.load();session.apply(answer(server));const flushing=session.flush();
 session.apply(answer(session.getSnapshot().data!));assert.equal(session.getSnapshot().data!.balance,4);
 assert.equal(disk.size,2);release();await flushing;
 assert.equal(server.balance,4);assert.equal(disk.size,0);assert.equal(session.getSnapshot().pending,0);
});
test('lost response and reload recover journal without duplicate stars',async()=>{
 let server=start(),lose=true;
 const disk=new Map<string,Record<string,unknown>>();
 const journal={read:()=>[...disk.values()],put:(_:string,e:Record<string,unknown>)=>{disk.set(String(e.requestId),e);},remove:(_:string,e:Record<string,unknown>)=>{disk.delete(String(e.requestId));}};
 const request=async(body?:Record<string,unknown>)=>{
  if(!body)return {...server,syncScope:'child:device'};
  server=changeLearning(server,body,[]);if(lose){lose=false;throw Error('response lost');}return server;
 };
 const first=new LearningSession(request,journal);await first.load();first.apply(answer(server));await first.flush();
 assert.equal(server.balance,2);assert.equal(disk.size,1);
 const reloaded=new LearningSession(request,journal);await reloaded.load();await reloaded.flush();
 assert.equal(server.balance,2);assert.equal(disk.size,0);assert.equal(reloaded.getSnapshot().data!.balance,2);
});
test('storage failure never shows successful answer',async()=>{
 const server=start();const session=new LearningSession(async()=>({...server,syncScope:'device'}),{read:()=>[],put:()=>{throw Error('full');},remove:()=>{}});
 await session.load();assert.throws(()=>session.apply(answer(server)),/full/);assert.equal(session.getSnapshot().data!.balance,0);
});
test('resuming uses cached lesson while network is unavailable',async()=>{
 const server=start();let calls=0;
 const session=new LearningSession(async()=>{calls++;if(calls>1)throw Error('offline');return {...server,syncScope:'device'};},{read:()=>[],put:()=>{},remove:()=>{}});
 await session.load();const resumed=await session.start({action:'start',requestId:crypto.randomUUID()});
 assert.equal(resumed.active!.id,server.active!.id);assert.equal(calls,1);session.dispose();
});
test('device journal is restored only for the verified server scope',async()=>{
 const server=start();let restored='';
 const session=new LearningSession(async()=>({...server,syncScope:'new-device'}),{read:scope=>{restored=scope;return [];},put:()=>{},remove:()=>{}});
 await session.load();assert.equal(restored,'new-device');session.dispose();assert.equal(session.getSnapshot().data,null);
});
test('conflicting batch keeps local records and never publishes false synced status',async()=>{
 const server=start();let saved=0;
 const session=new LearningSession(async body=>{if(body)throw Error('another device changed lesson');return {...server,syncScope:'device'};},{read:()=>[],put:()=>{saved++;},remove:()=>{saved--;}});
 await session.load();session.apply(answer(server));await session.flush();
 assert.equal(saved,1);assert.equal(session.getSnapshot().pending,1);assert.match(session.getSnapshot().error,/another device/);session.dispose();
});
