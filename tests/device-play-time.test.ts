import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import type {PlayTime,DeviceTimes} from '../src/domain/play-time';
import {createDemoData,handleDemo} from '../src/lib/demo-api';
test('device time isolates restrictions and remote inspection never activates a day',async()=>{
 const pg=new PGlite();try{
 await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&f<'202610080009').sort())await pg.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
 await pg.query('select kanto_setup($1,$2,$3,$4)',['家','孩子','scrypt:fixture','a'.repeat(64)]);
 const child=(await pg.query<{id:string}>('select id from kanto_children')).rows[0].id;
 const first=(await pg.query<{id:string}>('select id from kanto_devices')).rows[0].id;
 const second=crypto.randomUUID();
 await pg.query("insert into kanto_devices(id,child_id,name,token_hash,expires_at) values($1,$2,'iPad',$3,now()+interval '1 day')",[second,child,'b'.repeat(64)]);
 await pg.query("select kanto_control_play_time($1,'start',20,0,$2)",[child,crypto.randomUUID()]);
 await pg.exec(readFileSync('supabase/migrations/202610080009_device_play_time.sql','utf8'));
 const read=async(device=first,activate=true)=>(await pg.query<{v:PlayTime}>('select kanto_device_play_time_state($1,$2,$3) v',[child,device,activate])).rows[0].v;
 const control=async(device:string,action:string,minutes:number,expected:number,request=crypto.randomUUID())=>(await pg.query<{v:PlayTime}>('select kanto_control_device_play_time($1,$2,$3,$4,$5,$6) v',[child,device,action,minutes,expected,request])).rows[0].v;
 const original=await read(second);assert.equal(original.enabled,true);
 await control(first,'disable',20,1);assert.equal((await read()).enabled,false);assert.equal((await read(second)).expiresAt,original.expiresAt);
 const request=crypto.randomUUID(),start=await control(second,'start',30,1,request);
 assert.equal((await control(second,'start',30,1,request)).expiresAt,start.expiresAt);
 await assert.rejects(()=>control(second,'lock',30,1),/PLAY_TIME_CHANGED/);
 await pg.query("update kanto_device_play_time set usage_day=usage_day-1 where device_id=$1",[second]);
 assert.equal((await read(second,false)).pendingDay,true);
 await control(second,'configure',10,2);
 assert.equal((await read(second,false)).pendingDay,true);
 const renewed=await read(second);assert.equal(renewed.minutes,10);assert.equal(renewed.revision,4);assert.equal(renewed.pendingDay,false);
 assert.equal((await read(second)).expiresAt,renewed.expiresAt);
 await control(second,'lock',10,4);
 await assert.rejects(()=>pg.query("select kanto_device_learning_save($1,$2,0,'{}',false)",[child,second]),/PLAY_TIME_LOCKED/);
 assert.equal((await pg.query<{v:boolean}>("select kanto_device_learning_save($1,$2,0,'{}',false) v",[child,first])).rows[0].v,true);
 await assert.rejects(()=>pg.query('select kanto_device_play_time_state($1,$2)',[crypto.randomUUID(),first]),/NOT_FOUND/);
 for(const action of ['start','lock','configure'])await assert.rejects(()=>control(first,action,121,2),/INVALID_INPUT/);
 await pg.query('update kanto_devices set revoked_at=now() where id=$1',[second]);
 await assert.rejects(()=>read(second),/NOT_FOUND/);
 for(const role of ['anon','authenticated']){await pg.exec(`set role ${role}`);await assert.rejects(()=>read(),/permission denied/);await assert.rejects(()=>control(first,'start',20,2),/permission denied/);await pg.exec('reset role');}
 }finally{await pg.close();}
});
test('demo parent manages other device without locking current device',()=>{
 const data=createDemoData();handleDemo(data,'parent/unlock',{pin:'123456'});
 handleDemo(data,'parent/play-time',{deviceId:'demo-phone',action:'lock',minutes:30,expected:0,requestId:crypto.randomUUID()});
 assert.equal((handleDemo(data,'play-time') as PlayTime).enabled,false);
 const state=handleDemo(data,'parent/play-time') as DeviceTimes;
 assert.equal(state.devices.find(d=>d.id==='demo-phone')!.time.enabled,true);
 assert.equal(state.devices.find(d=>d.id==='demo-phone')!.time.minutes,30);
 assert.throws(()=>handleDemo(data,'parent/play-time',{deviceId:'foreign',action:'start',minutes:20,expected:0,requestId:crypto.randomUUID()}),/没有找到/);
});
