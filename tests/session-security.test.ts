import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPin, verifyPin, signParentSession, verifyParentSession, randomToken, tokenHash } from '../src/lib/server/security';
test('PINs use random salts and verify without storing plaintext', async () => {
  const hash = await hashPin('123456');
  assert.notEqual(hash, await hashPin('123456')); assert.ok(!hash.includes('123456'));
  assert.equal(await verifyPin('123456', hash), true); assert.equal(await verifyPin('123457', hash), false);
  assert.equal(await verifyPin('123456', 'invalid'), false);
});
test('parent signatures bind the device, PIN version, signing key and 15-minute expiry', () => {
  const secret = randomToken(); const now = Date.now(); const token = signParentSession('device-one', 1, secret, now);
  assert.equal(verifyParentSession(token, 'device-one', 1, secret, now), true);
  assert.equal(verifyParentSession(token, 'device-two', 1, secret, now), false);
  assert.equal(verifyParentSession(token, 'device-one', 2, secret, now), false);
  assert.equal(verifyParentSession(token, 'device-one', 1, randomToken(), now), false);
  assert.equal(verifyParentSession(token, 'device-one', 1, secret, now + 900_000), false);
  assert.equal(verifyParentSession(`${token}modified`, 'device-one', 1, secret, now), false);
  assert.equal(verifyParentSession(`${token}.extra`, 'device-one', 1, secret, now), false);
});
test('device credentials have 256 bits of randomness and only hashes are persisted', () => {
  const token = randomToken(); assert.match(token, /^[\w-]{43}$/); assert.equal(tokenHash(token).length, 64); assert.notEqual(tokenHash(token), token); assert.notEqual(token, randomToken());
});
