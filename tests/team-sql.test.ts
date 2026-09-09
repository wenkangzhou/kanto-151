import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('team migration preserves collection and limits a child to six owned companions', async t => {
  const pg = new PGlite();
  try {
    await pg.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    for (const file of ['202609080001_family_rewards.sql', '202609080002_chapter_discoveries.sql', '202609090003_anime_route.sql']) await pg.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    await pg.query('select kanto_setup($1,$2,$3,$4)', ['家庭', '孩子', 'scrypt:fixture', '9'.repeat(64)]);
    const child = (await pg.query<{ id: string }>('select id from kanto_children')).rows[0].id;
    const owned = [25, 16, 19, 21, 52, 23, 109];
    for (const id of owned) await pg.query("insert into kanto_pokemon_collection(child_id,pokemon_id,method,reason) values($1,$2,'capture','测试奖励')", [child, id]);
    const before = (await pg.query('select * from kanto_pokemon_collection order by pokemon_id')).rows;
    const snapshot = async () => (await pg.query<{ value: { team: number[]; records: { pokemonId: number }[] } }>('select kanto_snapshot($1) as value', [child])).rows[0].value;
    const change = async (expected: number[], team: number[], childId = child) => (await pg.query<{ value: { team: number[] } }>('select kanto_set_team($1,$2,$3) as value', [childId, expected, team])).rows[0].value;
    await pg.exec(readFileSync('supabase/migrations/202609090004_team.sql', 'utf8'));
    await t.test('upgrade starts with an empty team and preserves every existing record', async () => {
      assert.deepEqual((await snapshot()).team, []);
      assert.deepEqual((await pg.query('select * from kanto_pokemon_collection order by pokemon_id')).rows, before);
    });
    await t.test('rejects uncollected, duplicated, invalid and more than six Pokémon', async () => {
      await assert.rejects(() => change([], [4]), /TEAM_NOT_COLLECTED/);
      await assert.rejects(() => change([], [25, 25]), /INVALID_INPUT/);
      await assert.rejects(() => change([], owned), /INVALID_INPUT/);
      await assert.rejects(() => change([], [0]), /INVALID_INPUT/);
      await assert.rejects(() => change([], [25], randomUUID()), /NOT_FOUND/);
      assert.deepEqual((await snapshot()).team, []);
    });
    await t.test('fills all six positions, replaces a member and safely retries a lost response', async () => {
      const six = owned.slice(0, 6);
      assert.deepEqual((await change([], six)).team, six);
      const swapped = [109, ...six.slice(1)];
      assert.deepEqual((await change(six, swapped)).team, swapped);
      assert.deepEqual((await change(six, swapped)).team, swapped);
      assert.deepEqual((await pg.query('select * from kanto_pokemon_collection order by pokemon_id')).rows, before);
      assert.equal((await snapshot()).records.length, 7);
    });
    await t.test('stale-device changes cannot overwrite the first saved change', async () => {
      const current = (await snapshot()).team;
      const outcomes = await Promise.allSettled([change(current, current.slice(1)), change(current, current.slice(0, 5))]);
      assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1);
      const rejected = outcomes.find(result => result.status === 'rejected');
      assert.match(String(rejected?.reason), /TEAM_CHANGED/);
      assert.equal((await snapshot()).team.length, 5);
    });
    await t.test('returning every member to the Center never removes ownership', async () => {
      assert.deepEqual((await change((await snapshot()).team, [])).team, []);
      assert.deepEqual((await pg.query('select * from kanto_pokemon_collection order by pokemon_id')).rows, before);
      await assert.rejects(() => pg.query('insert into kanto_team values($1,7,25)', [child]), /check constraint/);
      await assert.rejects(() => pg.query('insert into kanto_team values($1,1,4)', [child]), /foreign key/);
    });
    await t.test('anonymous and authenticated database roles cannot read or alter the team', async () => {
      for (const role of ['anon', 'authenticated']) {
        await pg.exec(`set role ${role}`);
        await assert.rejects(() => pg.query('select * from kanto_team'), /permission denied/);
        await assert.rejects(() => change([], [25]), /permission denied/);
        await pg.exec('reset role');
      }
      assert.equal((await pg.query<{ enabled: boolean }>("select relrowsecurity as enabled from pg_class where relname='kanto_team'")).rows[0].enabled, true);
    });
  } finally { await pg.close(); }
});
