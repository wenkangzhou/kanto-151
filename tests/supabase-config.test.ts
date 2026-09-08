import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSupabaseConfig } from '../src/lib/supabase/config';
import { parseAppConfig } from '../src/lib/server/app-config';
const valid = {
  SUPABASE_URL: 'https://example.supabase.co/',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
};
test('Supabase config accepts complete new keys, normalizes the URL, allows an explicit empty demo', () => {
  assert.equal(parseSupabaseConfig(valid)?.url, 'https://example.supabase.co');
  assert.equal(parseSupabaseConfig({}, { allowEmpty: true }), null);
  assert.throws(() => parseSupabaseConfig({}), /缺少环境变量/);
  assert.throws(() => parseSupabaseConfig({ SUPABASE_URL: valid.SUPABASE_URL }, { allowEmpty: true }), /缺少环境变量/);
});
test('family secrets must be independent, sufficiently long and server-only', () => {
  const valid = { APP_SESSION_SECRET: 'a'.repeat(43), APP_SETUP_TOKEN: 'b'.repeat(43) };
  assert.deepEqual(parseAppConfig(valid), { sessionSecret: valid.APP_SESSION_SECRET, setupToken: valid.APP_SETUP_TOKEN });
  for (const env of [{}, { ...valid, APP_SETUP_TOKEN: 'short-secret' }, { ...valid, APP_SETUP_TOKEN: valid.APP_SESSION_SECRET }, { ...valid, NEXT_PUBLIC_APP_SETUP_TOKEN: valid.APP_SETUP_TOKEN }]) {
    assert.throws(() => parseAppConfig(env), error => error instanceof Error && !error.message.includes(valid.APP_SESSION_SECRET) && !error.message.includes('short-secret'));
  }
});
test('Supabase config blocks public names and legacy keys', () => {
  assert.throws(() => parseSupabaseConfig({ ...valid, NEXT_PUBLIC_SUPABASE_URL: '' }), /禁止/);
  assert.throws(() => parseSupabaseConfig({ ...valid, SUPABASE_SERVICE_ROLE_KEY: 'legacy' }), /新版/);
  assert.throws(() => parseSupabaseConfig({ ...valid, SUPABASE_SECRET_KEY: valid.SUPABASE_PUBLISHABLE_KEY }), /sb_secret_/);
});
test('Supabase validation does not disclose rejected values and disallows URLs carrying credentials', () => {
  const marker = 'test-sensitive-value';
  for (const change of [
    { SUPABASE_SECRET_KEY: marker },
    { SUPABASE_PUBLISHABLE_KEY: marker },
    { SUPABASE_URL: `https://${marker}@example.supabase.co` },
    { SUPABASE_URL: `https://example.supabase.co/?secret=${marker}` },
    { SUPABASE_URL: `https://example.supabase.co/path/${marker}` },
    { SUPABASE_URL: `http://${marker}.supabase.co` },
  ]) {
    assert.throws(() => parseSupabaseConfig({ ...valid, ...change }), error => error instanceof Error && !error.message.includes(marker));
  }
});
