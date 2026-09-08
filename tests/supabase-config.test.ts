import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSupabaseConfig } from '../src/lib/supabase/config';
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
