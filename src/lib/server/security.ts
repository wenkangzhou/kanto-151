import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
export function constantEqual(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export async function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(pin, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPin(pin: string, hash: string) {
  const [scheme, salt, expected] = hash.split(':');
  if (scheme !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(expected ?? '')) return false;
  const actual = await scrypt(pin, salt, 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export function signParentSession(deviceId: string, authVersion: number, secret: string, now = Date.now()) {
  const data = Buffer.from(JSON.stringify({ deviceId, authVersion, expires: now + 15 * 60 * 1000 })).toString('base64url');
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`;
}
export function verifyParentSession(token: string, deviceId: string, authVersion: number, secret: string, now = Date.now()) {
  return parentSessionExpiry(token, deviceId, authVersion, secret, now) !== null;
}
export function parentSessionExpiry(token: string, deviceId: string, authVersion: number, secret: string, now = Date.now()): number | null {
  if (token.length > 1000) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!constantEqual(signature, createHmac('sha256', secret).update(data).digest('base64url'))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    return parsed.deviceId === deviceId && parsed.authVersion === authVersion && Number.isSafeInteger(parsed.expires) && parsed.expires > now && parsed.expires <= now + 15 * 60 * 1000 ? parsed.expires : null;
  } catch { return null; }
}
