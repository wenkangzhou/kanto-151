import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { dailyDeadline, usageDay, playTimeLocked, remainingSeconds, validMinutes, type PlayTime } from '../src/domain/play-time';
import { createDemoData, handleDemo } from '../src/lib/demo-api';

test('play time expires at the deadline and never auto-renews', () => {
  const time: PlayTime = { enabled:true,minutes:20,expiresAt:'2026-09-28T10:20:00Z',revision:1,serverNow:'2026-09-28T10:00:00Z' };
  assert.equal(remainingSeconds(time,Date.parse(time.serverNow)),1200);
  assert.equal(playTimeLocked(time),false);
  assert.equal(playTimeLocked(time,Date.parse(time.expiresAt!)),true);
  assert.equal(playTimeLocked({...time,expiresAt:null}),true);
  assert.equal(playTimeLocked({...time,enabled:false,expiresAt:null}),false);
  for(const invalid of [0,121,-1,1.5,'20',null,NaN])assert.equal(validMinutes(invalid),false);
});

test('demo requires parent access and prevents child mutations while locked',()=>{
  const data=createDemoData();
  const action={action:'start',minutes:20,expected:0,requestId:crypto.randomUUID()};
  assert.throws(()=>handleDemo(data,'parent/play-time',action));
  handleDemo(data,'parent/unlock',{pin:'123456'});
  const start=handleDemo(data,'parent/play-time',action) as PlayTime;
  const retried=handleDemo(data,'parent/play-time',action) as PlayTime;
  assert.equal(retried.expiresAt,start.expiresAt);assert.equal(retried.revision,start.revision);
  handleDemo(data,'parent/play-time',{action:'lock',minutes:20,expected:1,requestId:crypto.randomUUID()});
  assert.throws(()=>handleDemo(data,'redeem',{code:'111111'}),/休息/);
  assert.throws(()=>handleDemo(data,'team',{team:[],expected:data.snapshot.team}),/休息/);
  handleDemo(data,'parent/lock',{});
  handleDemo(data,'parent/unlock',{pin:'123456'});
  handleDemo(data,'parent/play-time',{action:'disable',minutes:20,expected:2,requestId:crypto.randomUUID()});
  assert.equal(playTimeLocked(handleDemo(data,'play-time') as PlayTime),false);
});

test('play-time SQL provides atomic, isolated, retry-safe family sessions',async t=>{
  const pg=new PGlite();
  try {
    await pg.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await pg.exec(readFileSync('supabase/migrations/202609080001_family_rewards.sql','utf8'));
    await pg.query('select kanto_setup($1,$2,$3,$4)',['家','孩子','scrypt:fixture','a'.repeat(64)]);
    const child=(await pg.query<{id:string}>('select id from kanto_children')).rows[0].id;
    await pg.exec(readFileSync('supabase/migrations/202609280006_play_time.sql','utf8'));
    await pg.exec(readFileSync('supabase/migrations/202609290007_daily_play_time.sql','utf8'));
    const read=async()=>(await pg.query<{value:PlayTime}>('select kanto_play_time_state($1) as value',[child])).rows[0].value;
    const control=async(action:string,minutes:number,expected:number,request=crypto.randomUUID())=>(await pg.query<{value:PlayTime}>('select kanto_control_play_time($1,$2,$3,$4,$5) as value',[child,action,minutes,expected,request])).rows[0].value;
    await t.test('existing families are unrestricted until parent starts a session',async()=>{assert.equal((await read()).enabled,false);assert.equal((await read()).minutes,20);});
    await t.test('start retry does not extend the deadline and stale requests fail',async()=>{
      const request=crypto.randomUUID();const started=await control('start',20,0,request);
      const retry=await control('start',20,0,request);
      assert.equal(retry.expiresAt,started.expiresAt);assert.equal(retry.revision,1);
      await assert.rejects(()=>control('start',20,0),/PLAY_TIME_CHANGED/);
      const updated=await control('configure',30,1);
      assert.equal(updated.expiresAt,started.expiresAt);assert.equal(updated.minutes,30);
      await assert.rejects(()=>control('start',20,1),/PLAY_TIME_CHANGED/);
    });
    await t.test('manual lock and expired session stay locked until parent explicitly starts again',async()=>{
      assert.equal(playTimeLocked(await control('lock',30,2)),true);
      const next=await control('start',30,3);assert.equal(playTimeLocked(next),false);
      await pg.query("update kanto_play_time set expires_at=clock_timestamp()-interval '1 second' where child_id=$1",[child]);
      assert.equal(playTimeLocked(await read()),true);
      assert.equal(playTimeLocked(await control('configure',10,4)),true);
      assert.equal(playTimeLocked(await control('disable',10,5)),false);
    });
    await t.test('bad durations and actions fail without changes',async()=>{
      for(const [action,minutes] of [['start',0],['start',121],['other',20]] as const)await assert.rejects(()=>control(action,minutes,6),/INVALID_INPUT/);
      assert.equal((await read()).revision,6);
    });
    await t.test('unknown family sees no other deadline and public roles cannot read or control',async()=>{
      const other=(await pg.query<{value:PlayTime}>('select kanto_play_time_state($1) as value',[crypto.randomUUID()])).rows[0].value;
      assert.equal(other.enabled,false);assert.equal(other.expiresAt,null);
      for(const role of ['anon','authenticated']){
        await pg.exec(`set role ${role}`);
        await assert.rejects(()=>read(),/permission denied/);
        await assert.rejects(()=>control('start',20,6),/permission denied/);
        await assert.rejects(()=>pg.query('select * from kanto_play_time'),/permission denied/);
        await pg.exec('reset role');
      }
    });
    await t.test('new calendar day renews once, including manual rest, but disabled remains disabled',async()=>{
      const locked=await control('lock',20,6);
      assert.equal(locked.expiresAt,null);
      await pg.query("update kanto_play_time set usage_day=((clock_timestamp() at time zone 'Asia/Shanghai')::date-1) where child_id=$1",[child]);
      const renewed=await read();
      assert.equal(renewed.revision,8);
      assert.equal(playTimeLocked(renewed),false);
      assert.equal(renewed.usageDay,usageDay(Date.parse(renewed.serverNow)));
      assert.equal((await read()).expiresAt,renewed.expiresAt);
      assert.equal((await read()).revision,8);
      await control('disable',20,8);
      await pg.query("update kanto_play_time set usage_day=usage_day-1 where child_id=$1",[child]);
      assert.equal((await read()).enabled,false);
      assert.equal((await read()).revision,9);
    });
  } finally {await pg.close();}
});

test('Beijing midnight caps the current day and demo grants only one new daily session',()=>{
  const before=Date.parse('2026-09-29T15:59:00Z');
  assert.equal(usageDay(before),'2026-09-29');
  assert.equal(usageDay(before+60_000),'2026-09-30');
  assert.equal(dailyDeadline(before,20),'2026-09-29T16:00:00.000Z');
  const data=createDemoData();
  data.playTime={enabled:true,minutes:20,expiresAt:null,revision:4,serverNow:new Date().toISOString(),usageDay:'2020-01-01'};
  const first=handleDemo(data,'play-time') as PlayTime;
  const second=handleDemo(data,'play-time') as PlayTime;
  assert.equal(first.revision,5);
  assert.equal(second.revision,5);
  assert.equal(first.expiresAt,second.expiresAt);
  assert.equal(playTimeLocked(first),false);
});
