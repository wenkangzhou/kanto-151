import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createFamilyExport,verifyFamilyExport,exportSections} from '../src/lib/family-export';

async function database() {
  const pg=new PGlite();
  await pg.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())
    await pg.exec(readFileSync('supabase/migrations/'+file,'utf8'));
  return pg;
}
test('full export is private, untruncated, verifiable and reconstructable in an isolated database',async()=>{
  const pg=await database();let restored:PGlite|undefined;
  try {
    const device=(await pg.query<{id:string}>("select kanto_setup('Test family','Test child','scrypt:SECRET_PIN_HASH',$1) as id",['a'.repeat(64)])).rows[0].id;
    const child=(await pg.query<{child_id:string}>('select child_id from kanto_devices where id=$1',[device])).rows[0].child_id;
    await pg.query("insert into kanto_reward_codes(id,child_id,code,type,reason) select gen_random_uuid(),$1,lpad(n::text,6,'0'),'capture','A saved memory' from generate_series(1,1005) n",[child]);
    await pg.query("select kanto_redeem($1,'000001')",[child]);
    const evolution=randomUUID();
    await pg.query("select kanto_create_reward($1,$2,'evolution','Kept trying')",[child,evolution]);
    const code=(await pg.query<{code:string}>('select code from kanto_reward_codes where id=$1',[evolution])).rows[0].code;
    await pg.query('select kanto_redeem($1,$2)',[child,code]);
    await pg.query("insert into kanto_learning(child_id,state) values($1,$2::jsonb)",[child,JSON.stringify({stars:18,ledger:[{reason:'practice',stars:2}]})]);
    const data=(await pg.query<{data:Record<string,unknown>}>('select kanto_export_family($1) as data',[child])).rows[0].data;
    const file=createFamilyExport(data);
    assert.equal(file.counts.reward_codes,1006);
    assert.equal(file.counts.receipts,2);
    assert.equal(file.counts.inventory,1);
    assert.equal(file.counts.pokemon_collection,1);
    assert.ok(!JSON.stringify(file).includes('scrypt:SECRET_PIN_HASH'));
    assert.ok(!JSON.stringify(file).includes('token_hash'));
    assert.ok(!JSON.stringify(file).includes('code_hash'));
    assert.equal(verifyFamilyExport(JSON.parse(JSON.stringify(file,null,2))).sha256,file.sha256);
    const damaged=structuredClone(file);(damaged.data.reward_codes as Record<string,unknown>[])[0].reason='changed';
    assert.throws(()=>verifyFamilyExport(damaged),/checksum/);
    await pg.exec('set role anon');
    await assert.rejects(()=>pg.query('select kanto_export_family($1)',[child]),/permission denied/);
    await pg.exec('reset role; set role authenticated');
    await assert.rejects(()=>pg.query('select kanto_export_family($1)',[child]),/permission denied/);
    await pg.exec('reset role');

    // Recovery rehearsal only: fresh local DB, new credentials; no production restore endpoint.
    restored=await database();
    const family=data.family as Record<string,unknown>;
    await restored.query('insert into kanto_families(id,name,created_at,pin_hash) values($1,$2,$3,$4)',[family.id,family.name,family.created_at,'NEW_LOCAL_PIN']);
    await restored.query("insert into kanto_children select * from jsonb_populate_record(null::kanto_children,$1::jsonb)",[JSON.stringify(data.child)]);
    const devices=data.devices as Record<string,unknown>[];
    for(const d of devices) await restored.query('insert into kanto_devices(id,child_id,name,created_at,expires_at,revoked_at,token_hash) values($1,$2,$3,$4,$5,$6,$7)',[d.id,d.child_id,d.name,d.created_at,d.expires_at,d.revoked_at,'b'.repeat(64)]);
    for(const table of ['reward_codes','inventory']) {
      const rows=(data[table] as Record<string,unknown>[]).map(row=>({...row,receipt_id:null}));
      await restored.query(`insert into kanto_${table} select * from jsonb_populate_recordset(null::kanto_${table},$1::jsonb)`,[JSON.stringify(rows)]);
    }
    for(const table of ['receipts',...exportSections.filter(t=>!['devices','reward_codes','inventory','receipts'].includes(t))])
      await restored.query(`insert into kanto_${table} select * from jsonb_populate_recordset(null::kanto_${table},$1::jsonb)`,[JSON.stringify(data[table])]);
    for(const table of ['reward_codes','inventory'])
      await restored.query(`update kanto_${table} t set receipt_id=s.receipt_id from jsonb_populate_recordset(null::kanto_${table},$1::jsonb) s where t.id=s.id`,[JSON.stringify(data[table])]);
    const recovered=(await restored.query<{data:Record<string,unknown>}>('select kanto_export_family($1) as data',[child])).rows[0].data;
    assert.deepEqual(recovered,data);
  } finally {await pg.close();await restored?.close();}
});
