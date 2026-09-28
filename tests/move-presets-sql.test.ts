import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { defaultSlots, learnset } from '../src/domain/battle-loadout';

test('move preset migration preserves collection, enforces source slots, isolation and optimistic concurrency',async t=>{
  const pg=new PGlite();
  try {
    await pg.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    for(const file of ['202609080001_family_rewards.sql','202609080002_chapter_discoveries.sql','202609090003_anime_route.sql','202609090004_team.sql'])await pg.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
    await pg.query('select kanto_setup($1,$2,$3,$4)',['家','孩子','scrypt:fixture','a'.repeat(64)]);
    const child=(await pg.query<{id:string}>('select id from kanto_children')).rows[0].id;
    await pg.query("insert into kanto_pokemon_collection(child_id,pokemon_id,method,reason) values($1,104,'capture','测试')",[child]);
    const before=(await pg.query('select * from kanto_pokemon_collection')).rows;
    await pg.exec(readFileSync('supabase/migrations/202609240005_battle_loadouts.sql','utf8'));
    const snapshot=async()=>(await pg.query<{value:{movePresets:Record<string,unknown>}}>('select kanto_snapshot($1) as value',[child])).rows[0].value;
    const save=async(moves:unknown,expected:unknown=null,id=104)=>(await pg.query('select kanto_set_moves($1,$2,$3::jsonb,$4::jsonb)',[child,id,expected===null?null:JSON.stringify(expected),JSON.stringify(moves)])).rows;
    const slots=defaultSlots(104);
    await t.test('old data is intact and no presets are inserted implicitly',async()=>{
      assert.deepEqual((await snapshot()).movePresets,{});assert.deepEqual((await pg.query('select * from kanto_pokemon_collection')).rows,before);
    });
    await t.test('invalid source, unknown Pokémon, duplicate and malformed moves fail atomically',async()=>{
      await assert.rejects(()=>save(['ice-beam',slots[1],slots[2],slots[3]]),/INVALID_INPUT/);
      await assert.rejects(()=>save([slots[0],slots[0],slots[2],slots[3]]),/INVALID_INPUT/);
      await assert.rejects(()=>save(slots,null,150),/TEAM_NOT_COLLECTED/);
      await assert.rejects(()=>save({moves:slots}),/INVALID_INPUT/);
      await assert.rejects(()=>save([null]),/INVALID_INPUT/);
      assert.deepEqual((await snapshot()).movePresets,{});
    });
    await t.test('save survives readback, retries are idempotent and stale writes fail',async()=>{
      await save(slots);await save(slots);assert.deepEqual((await snapshot()).movePresets['104'],slots);
      const changed=[...slots];changed[0]=learnset(104).level.find(m=>!slots.includes(m.id))!.id;
      await assert.rejects(()=>save(changed),/MOVES_CHANGED/);
      await save(changed,slots);assert.deepEqual((await snapshot()).movePresets['104'],changed);
    });
    await t.test('evolution keeps only moves legal in the same source slots of the new form',async()=>{
      const before=(await snapshot()).movePresets['104'] as (string|null)[];
      await pg.query("insert into kanto_pokemon_collection(child_id,pokemon_id,method,reason) values($1,105,'evolution','进化测试')",[child]);
      const inherited=(await snapshot()).movePresets['105'] as (string|null)[];
      assert.equal(inherited.length,4);
      for(let slot=0;slot<4;slot++){
        const allowed=learnset(105)[slot===3?'machine':'level'].some(m=>m.id===before[slot]);
        assert.equal(inherited[slot],allowed?before[slot]:null);
      }
    });
    await t.test('anonymous roles cannot inspect or mutate presets',async()=>{
      for(const role of ['anon','authenticated']){
        await pg.exec(`set role ${role}`);
        await assert.rejects(()=>pg.query('select * from kanto_move_presets'),/permission denied/);
        await assert.rejects(()=>save(slots),/permission denied/);
        await pg.exec('reset role');
      }
    });
  }finally{await pg.close();}
});
