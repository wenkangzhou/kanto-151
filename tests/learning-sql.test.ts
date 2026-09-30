import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {defaultSlots,learnset,starterMachines} from '../src/domain/battle-loadout';
test('learning SQL migrates equipped moves, serializes balances and enforces unlocks and time lock',async()=>{
 const pg=new PGlite();try{
  await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  for(const file of ['202609080001_family_rewards.sql','202609080002_chapter_discoveries.sql','202609090003_anime_route.sql','202609090004_team.sql','202609240005_battle_loadouts.sql','202609280006_play_time.sql','202609290007_daily_play_time.sql'])await pg.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  await pg.query('select kanto_setup($1,$2,$3,$4)',['家','孩子','scrypt:fixture','a'.repeat(64)]);
  const child=(await pg.query<{id:string}>('select id from kanto_children')).rows[0].id;
  await pg.query("insert into kanto_pokemon_collection(child_id,pokemon_id,method) values($1,104,'capture')",[child]);
  const old=[...learnset(104).level.slice(0,3).map(m=>m.id),'ice-beam'];
  await pg.query('select kanto_set_moves($1,104,null,$2::jsonb)',[child,JSON.stringify(old)]);
  await pg.exec(readFileSync('supabase/migrations/202609290008_learning.sql','utf8'));
  const row=(await pg.query<{state:{unlocked:string[]}}> ('select state from kanto_learning where child_id=$1',[child])).rows[0];
  assert.ok(row.state.unlocked.includes('ice-beam'));
  const migrated=(await pg.query<{moves:unknown[]}>('select moves from kanto_move_presets where child_id=$1',[child])).rows[0].moves;
  assert.deepEqual(migrated,[old[0],old[1],old[3],null]);
  const locked=learnset(104).machine.find(m=>!starterMachines(104).includes(m.id)&&m.id!=='ice-beam')!.id;
  const proposed=defaultSlots(104);proposed[2]=locked;
  await assert.rejects(()=>pg.query('select kanto_set_moves($1,104,$2::jsonb,$3::jsonb)',[child,JSON.stringify(migrated),JSON.stringify(proposed)]),/MOVE_LOCKED/);
  const save=async(expected:number,state:object,parent=false)=>(await pg.query<{ok:boolean}>('select kanto_learning_save($1,$2,$3::jsonb,$4) as ok',[child,expected,JSON.stringify(state),parent])).rows[0].ok;
  assert.equal(await save(0,{balance:4,unlocked:['ice-beam',locked]}),true);
  assert.equal(await save(0,{balance:24,unlocked:[]}),false);
  await pg.query('select kanto_set_moves($1,104,$2::jsonb,$3::jsonb)',[child,JSON.stringify(migrated),JSON.stringify(proposed)]);
  await pg.query('select kanto_control_play_time($1,$2,20,0,$3)',[child,'lock',crypto.randomUUID()]);
  await assert.rejects(()=>save(1,{balance:100}),/PLAY_TIME_LOCKED/);
  assert.equal(await save(1,{balance:4,unlocked:['ice-beam',locked]},true),true);
  for(const role of ['anon','authenticated']){
   await pg.exec(`set role ${role}`);await assert.rejects(()=>pg.query('select * from kanto_learning'),/permission denied/);await assert.rejects(()=>save(2,{balance:999},true),/permission denied/);await pg.exec('reset role');
  }
 }finally{await pg.close();}
});
