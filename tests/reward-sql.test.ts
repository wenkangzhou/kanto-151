import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { chapters, pokemon } from '../src/domain/pokemon';

test('PostgreSQL migration and atomic family reward lifecycle', async t => {
  const pg = new PGlite();
  await pg.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await pg.exec(readFileSync('supabase/migrations/202609080001_family_rewards.sql', 'utf8'));
  async function rpc<T = Record<string, unknown>>(fn: string, args: unknown[] = []): Promise<T> {
    const result = await pg.query<{ value: T }>(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(',')}) as value`, args);
    return result.rows[0].value;
  }
  const device = await rpc<string>('kanto_setup', ['测试家庭', '测试孩子', 'scrypt:test-fixture', 'a'.repeat(64)]);
  const child = (await pg.query<{ child_id: string }>('select child_id from kanto_devices where id=$1', [device])).rows[0].child_id;
  const otherChild = randomUUID();
  const reward = async (type = 'capture', reason = '认真阅读') => rpc<{ id: string; code: string; receipt_id: string | null }>('kanto_create_reward', [child, randomUUID(), type, reason]);
  const seed = async (ids: number[]) => {
    for (const id of ids) await pg.query("insert into kanto_pokemon_collection(child_id,pokemon_id,method,reason) values($1,$2,'capture','fixture') on conflict do nothing", [child, id]);
  };
  try {
    await t.test('PIN and families are not readable through anonymous / authenticated database roles', async () => {
      assert.ok(device);
      await assert.rejects(() => rpc('kanto_setup', ['another', 'child', 'scrypt:x', 'b'.repeat(64)]), /ALREADY_SETUP/);
      await pg.exec('set role anon');
      await assert.rejects(() => pg.query('select * from public.kanto_families'), /permission denied/);
      await assert.rejects(() => rpc('kanto_redeem', [child, '123456']), /permission denied/);
      await pg.exec('reset role; set role authenticated');
      await assert.rejects(() => pg.query("insert into kanto_pokemon_collection(child_id,pokemon_id,method) values($1,151,'capture')", [child]), /permission denied/);
      await pg.exec('reset role');
    });
    await t.test('rate limits persist and pairing codes are single-use', async () => {
      assert.equal(await rpc('kanto_rate_limit', ['test', 1, 60]), true);
      assert.equal(await rpc('kanto_rate_limit', ['test', 1, 60]), false);
      await pg.query('insert into kanto_pairing_codes(child_id,code_hash) values($1,$2)', [child, 'pair-hash']);
      await rpc('kanto_pair', ['pair-hash', 'b'.repeat(64), 'test device']);
      await assert.rejects(() => rpc('kanto_pair', ['pair-hash', 'c'.repeat(64), 'test']), /INVALID_PAIRING/);
    });
    await t.test('reward creation retry returns the same six-digit code without selecting a Pokémon', async () => {
      const request = randomUUID();
      const first = await rpc('kanto_create_reward', [child, request, 'capture', '坚持']);
      const again = await rpc('kanto_create_reward', [child, request, 'capture', '坚持']);
      assert.deepEqual(again, first); assert.match(first.code as string, /^\d{6}$/); assert.equal(first.receipt_id, null);
      await assert.rejects(() => rpc('kanto_create_reward', [child, request, 'evolution', '坚持']), /REQUEST_CONFLICT/);
    });
    await t.test('redemption commits once, preserves the reason, replays the same receipt', async () => {
      const r = await reward();
      const first = await rpc('kanto_redeem', [child, r.code]);
      const again = await rpc('kanto_redeem', [child, r.code]);
      assert.deepEqual(again, first); assert.equal(first.reason, '认真阅读');
      assert.ok(chapters[0].pokemonIds.includes(first.pokemon_id as number));
      const snapshot = await rpc<{ records: unknown[] }>('kanto_snapshot', [child]);
      assert.equal(snapshot.records.length, 1);
      await assert.rejects(() => rpc('kanto_redeem', [otherChild, r.code]), /NOT_FOUND/);
      await pg.query("update kanto_reward_codes set expires_at=now()-interval '1 day' where id=$1", [r.id]);
      assert.deepEqual(await rpc('kanto_redeem', [child, r.code]), first);
    });
    await t.test('expired and revoked rewards make no progress and are not consumed', async () => {
      for (const column of ['expires_at', 'revoked_at']) {
        const r = await reward();
        await pg.query(`update kanto_reward_codes set ${column}=now()-interval '1 day' where id=$1`, [r.id]);
        await assert.rejects(() => rpc('kanto_redeem', [child, r.code]), /EXPIRED_CODE/);
        const row = (await pg.query<{ redeemed_at: null }>('select redeemed_at from kanto_reward_codes where id=$1', [r.id])).rows[0];
        assert.equal(row.redeemed_at, null);
      }
    });
    await t.test('different codes never duplicate a capture and advance the chapter without evolutions', async () => {
      const codes = await Promise.all(Array.from({ length: 4 }, () => reward()));
      const results = await Promise.all(codes.map(r => rpc('kanto_redeem', [child, r.code])));
      assert.equal(new Set(results.map(r => r.pokemon_id)).size, 4);
      assert.equal(await rpc('kanto_current_chapter', [child]), 2);
      const chapter = (await pg.query<{ chapter: number }>('select chapter from kanto_story_progress where child_id=$1', [child])).rows[0].chapter;
      assert.equal(chapter, 2);
    });
    await t.test('Eevee evolutions preserve the original and consume precisely one reason-carrying ticket', async () => {
      await seed([133]);
      const r = await reward('evolution', '尝试困难的事');
      const ticketReceipt = await rpc('kanto_redeem', [child, r.code]);
      assert.equal(ticketReceipt.kind, 'evolution-ticket');
      await assert.rejects(() => rpc('kanto_use_ticket', [child, ticketReceipt.ticket_id, 149]), /EVOLUTION_LOCKED/);
      const result = await rpc('kanto_use_ticket', [child, ticketReceipt.ticket_id, 134]);
      assert.equal(result.reason, '尝试困难的事'); assert.equal(result.from_pokemon_id, 133);
      assert.deepEqual(await rpc('kanto_use_ticket', [child, ticketReceipt.ticket_id, 134]), result);
      await assert.rejects(() => rpc('kanto_use_ticket', [child, ticketReceipt.ticket_id, 135]), /TICKET_USED/);
      const snapshot = await rpc<{ records: { pokemonId: number }[]; inventory: { evolution: number } }>('kanto_snapshot', [child]);
      assert.ok(snapshot.records.some(r => r.pokemonId === 133)); assert.ok(snapshot.records.some(r => r.pokemonId === 134)); assert.equal(snapshot.inventory.evolution, 0);
      for (const id of [135, 136]) { const code = await reward('evolution'); const receipt = await rpc('kanto_redeem', [child, code.code]); assert.equal((await rpc('kanto_use_ticket', [child, receipt.ticket_id, id])).pokemon_id, id); }
    });
    await t.test('legendary gates and Mew cannot be bypassed with an ordinary ticket', async () => {
      const code = await reward('legendary'); const ticket = await rpc('kanto_redeem', [child, code.code]);
      await assert.rejects(() => rpc('kanto_use_ticket', [child, ticket.ticket_id, 144]), /LEGENDARY_LOCKED/);
      await assert.rejects(() => rpc('kanto_use_ticket', [child, ticket.ticket_id, 151]), /LEGENDARY_LOCKED/);
      await assert.rejects(() => rpc('kanto_meet_mew', [child]), /MEW_LOCKED/);
      await seed(Array.from({ length: 60 }, (_, i) => i + 1));
      assert.equal((await rpc('kanto_use_ticket', [child, ticket.ticket_id, 144])).pokemon_id, 144);
    });
    await t.test('completed stories use only exploration; exhausted pools preserve the reward', async () => {
      await seed(chapters.flatMap(chapter => chapter.pokemonIds));
      assert.equal(await rpc('kanto_current_chapter', [child]), 7);
      const r = await reward(); const result = await rpc('kanto_redeem', [child, r.code]);
      assert.ok(pokemon.some(p => p.id === result.pokemon_id && p.category === 'exploration'));
      await seed(pokemon.filter(p => p.category === 'exploration').map(p => p.id));
      const exhausted = await reward();
      await assert.rejects(() => rpc('kanto_redeem', [child, exhausted.code]), /CAPTURE_POOL_EMPTY/);
      assert.equal((await pg.query<{ redeemed_at: null }>('select redeemed_at from kanto_reward_codes where id=$1', [exhausted.id])).rows[0].redeemed_at, null);
    });
    await t.test('150 collected unlock Mew without a ticket; retry returns the persisted final encounter', async () => {
      await seed(Array.from({ length: 150 }, (_, i) => i + 1));
      const receipt = await rpc('kanto_meet_mew', [child]);
      assert.equal(receipt.pokemon_id, 151); assert.equal(receipt.ticket_id, null);
      assert.deepEqual(await rpc('kanto_meet_mew', [child]), receipt);
      const snapshot = await rpc<{ records: unknown[] }>('kanto_snapshot', [child]); assert.equal(snapshot.records.length, 151);
    });
    await t.test('PIN recovery increments the session version without deleting collection', async () => {
      await rpc('kanto_recover', ['scrypt:new-test-fixture', 'd'.repeat(64)]);
      assert.equal((await pg.query<{ auth_version: number }>('select auth_version from kanto_families')).rows[0].auth_version, 2);
      assert.equal((await rpc<{ records: unknown[] }>('kanto_snapshot', [child])).records.length, 151);
    });
  } finally { await pg.close(); }
});
