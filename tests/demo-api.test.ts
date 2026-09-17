import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData, handleDemo } from '../src/lib/demo-api';
import type { Receipt, ParentReward } from '../src/domain/types';
import { evolutionOptions } from '../src/domain/collection';

test('demo supports reward, receipt, team and evolution without duplicate consumption',()=>{
 const d=createDemoData();const initial=d.snapshot.records.length;
 const r=handleDemo(d,'redeem',{code:'111111'}) as Receipt;
 assert.equal(d.snapshot.records.length,initial+1);
 assert.equal((handleDemo(d,'redeem',{code:'111111'}) as Receipt).id,r.id);
 handleDemo(d,'receipts/acknowledge',{id:r.id});assert.equal(d.snapshot.pendingReceipt,null);
 const target=evolutionOptions(d.snapshot)[0];
 const evolved=handleDemo(d,'tickets/use',{ticketId:'demo-evolution',targetId:target.id}) as Receipt;
 assert.equal(evolved.kind,'evolution');assert.equal(d.snapshot.inventory.evolution,0);
 assert.equal((handleDemo(d,'tickets/use',{ticketId:'demo-evolution',targetId:target.id}) as Receipt).id,evolved.id);
 assert.ok(d.snapshot.records.some(r=>r.pokemonId===target.evolvesFrom));
 const team=[target.id];handleDemo(d,'team',{team,expected:d.snapshot.team});assert.deepEqual(d.snapshot.team,team);
 assert.throws(()=>handleDemo(d,'team',{team:[1],expected:[]}),/变化/);
 assert.throws(()=>handleDemo(d,'team',{team:[1,1],expected:team}),/六位/);
});
test('demo parent rewards, revocation, tickets, legends and finale work independently',()=>{
 const d=createDemoData();assert.throws(()=>handleDemo(d,'parent/rewards'),/PIN/);
 handleDemo(d,'parent/unlock',{pin:'123456'});
 const body={type:'evolution',reason:'演示鼓励',requestId:'one'};
 const r=handleDemo(d,'parent/rewards',body) as ParentReward;
 assert.equal((handleDemo(d,'parent/rewards',body) as ParentReward).id,r.id);
 handleDemo(d,'redeem',{code:r.code});assert.equal(d.snapshot.inventory.evolution,2);
 assert.throws(()=>handleDemo(d,'parent/rewards/revoke',{id:r.id}));
 handleDemo(d,'parent/rewards/revoke',{id:'demo-reward-2'});
 assert.throws(()=>handleDemo(d,'redeem',{code:'333333'}));
 const legend=handleDemo(d,'tickets/use',{ticketId:'demo-legendary',targetId:144}) as Receipt;
 assert.equal(legend.kind,'legendary');assert.equal(d.snapshot.inventory.legendary,0);
 const final=createDemoData(true);handleDemo(final,'mew',{});assert.equal(final.snapshot.records.length,151);
 handleDemo(final,'mew',{});assert.equal(final.snapshot.records.length,151);
 assert.equal(createDemoData().snapshot.records.length,111);
});
test('opted-in API transport never fetches real family data, even on errors',async()=>{
 const original={window:globalThis.window,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 const storage=new Map<string,string>([['kanto-visitor-demo-v1','on']]);let fetched=0;
 Object.assign(globalThis,{window:{location:{pathname:'/'}},sessionStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)},fetch:()=>{fetched++;throw new Error('real API forbidden');}});
 try {
  const {api}=await import('../src/lib/api-client');
  const s=await api<{familyName:string}>('session');assert.equal(s.familyName,'演示家庭');
  await assert.rejects(api('unsupported',{}));
  storage.set('kanto-visitor-data-v1','broken');await assert.rejects(api('session'));
  assert.equal(fetched,0);
 }finally{Object.assign(globalThis,original);}
});
