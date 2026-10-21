import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestJson,RequestError} from '../src/lib/request-json';
test('timeout aborts a stalled response without replaying a mutation',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let calls=0;
 t.mock.method(globalThis,'fetch',(_url:unknown,init:RequestInit)=>{calls++;return new Promise((_resolve,reject)=>init.signal!.addEventListener('abort',()=>reject(Error('aborted'))));});
 const task=requestJson('/test',{method:'POST'},20000);
 const check=assert.rejects(task,(e:RequestError)=>e.code==='TIMEOUT'&&e.message.includes('原奖励码'));
 t.mock.timers.tick(20000);await check;assert.equal(calls,1);
});
test('timeout includes a response body that never finishes',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 t.mock.method(globalThis,'fetch',async(_url:unknown,init:RequestInit)=>({status:200,json:()=>new Promise((_r,reject)=>init.signal!.addEventListener('abort',()=>reject(Error('aborted'))))}));
 const task=requestJson('/test',{});const check=assert.rejects(task,(e:RequestError)=>e.code==='TIMEOUT');
 await Promise.resolve();t.mock.timers.tick(15000);await check;
});
test('caller cancellation remains distinct from network failure',async t=>{
 const controller=new AbortController();controller.abort();
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({});});
 await assert.rejects(requestJson('/test',{signal:controller.signal}),(e:RequestError)=>e.code==='ABORTED');assert.equal(calls,0);
});
test('JSON lists and server error payloads are preserved',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json([{id:1}]));
 assert.deepEqual((await requestJson('/test',{})).result,[{id:1}]);
 t.mock.method(globalThis,'fetch',async()=>Response.json({code:'DEVICE_REQUIRED'},{status:401}));
 const result=await requestJson('/test',{});assert.equal(result.response.status,401);assert.equal(result.result.code,'DEVICE_REQUIRED');
});
