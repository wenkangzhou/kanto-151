import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRewardCode } from '../src/domain/reward-code';
test('reward entry preserves leading zeroes and handles formatted clipboard digits', () => {
  assert.equal(normalizeRewardCode('000123'), '000123');
  assert.equal(normalizeRewardCode('０１ ２３-４５'), '012345');
  assert.equal(normalizeRewardCode('奖励码：012 345\n'), '012345');
  assert.equal(normalizeRewardCode('0123456789'), '012345');
  assert.equal(normalizeRewardCode('abc'), '');
  assert.equal(normalizeRewardCode('0'), '0');
});
