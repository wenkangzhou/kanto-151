import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../supabase/server';
import { getRuntimeConfig } from './runtime-config';
import { tokenHash, parentSessionExpiry } from './security';
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const db = () => createSupabaseAdminClient();
export function reply(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
}
export function assertMutation(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== request.nextUrl.origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403, 'ORIGIN', '请在应用内重试。');
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'CONTENT_TYPE', '请求格式不正确。');
}
export async function body(request: NextRequest): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') ?? 0) > 8192) throw new ApiError(413, 'TOO_LARGE', '输入内容太长。');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'INPUT', '请填写必要内容。');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > 8192) { await reader.cancel(); throw new ApiError(413, 'TOO_LARGE', '输入内容太长。'); }
    chunks.push(value);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error();
    return parsed;
  } catch { throw new ApiError(400, 'INPUT', '请求格式不正确。'); }
}
export function text(input: Record<string, unknown>, key: string, max: number, min = 1) {
  const value = input[key];
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new ApiError(400, 'INPUT', '请检查填写内容的长度。');
  return value.trim();
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) throw new ApiError(400, 'INPUT', '请求编号不正确。');
  return value;
}
export function pin(input: Record<string, unknown>) {
  const value = text(input, 'pin', 6, 6);
  if (!/^\d{6}$/.test(value)) throw new ApiError(400, 'INPUT', 'PIN 需要是 6 位数字。');
  return value;
}
const messages: Record<string, string> = {
  ALREADY_SETUP: '家庭已初始化，请连接设备或使用恢复入口。', INVALID_PAIRING: '连接码不正确、已使用或已过期。',
  REQUEST_CONFLICT: '这次操作已处理，请刷新查看结果。', INVALID_CODE: '没有找到这个奖励码，请检查六位数字。', EXPIRED_CODE: '奖励码已过期或已撤销，请联系家长。',
  CAPTURE_POOL_EMPTY: '普通捕捉伙伴已收集完！这个奖励码没有被消耗。可以继续进化或探索传说。',
  INVALID_TICKET: '没有找到这张券，请刷新背包。', TICKET_USED: '这张券已经使用，请查看已保存的相遇。', ALREADY_COLLECTED: '这位伙伴已经在图鉴里了，券没有被消耗。',
  EVOLUTION_LOCKED: '还没有收集对应的前一个形态，券没有被消耗。', LEGENDARY_LOCKED: '还没有达到这次传说相遇的条件，券没有被消耗。', MEW_LOCKED: '先与前 150 位伙伴相遇，最后的奇迹就会开启。',
  NOT_FOUND: '没有找到这条记录。', INVALID_INPUT: '输入内容不正确。', TRY_AGAIN: '请稍后重试。',
};
export function databaseError(error: { message?: string; code?: string }) {
  if (error.code === 'PGRST202' || error.code === 'PGRST205' || error.code === '42P01') return new ApiError(503, 'MIGRATION_REQUIRED', '家庭手帐尚未初始化，请家长先完成数据库配置。');
  const code = Object.keys(messages).find(key => error.message === key);
  return new ApiError(code ? 409 : 503, code ?? 'DATABASE', code ? messages[code] : '暂时无法连接家庭手帐，请稍后重试。');
}
export async function rpc<T = unknown>(name: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db().rpc(name, params);
  if (error) throw databaseError(error);
  return data as T;
}
export async function limit(bucket: string, attempts: number, seconds = 900) {
  if (!await rpc<boolean>('kanto_rate_limit', { p_bucket: bucket, p_limit: attempts, p_seconds: seconds })) throw new ApiError(429, 'RATE_LIMIT', '尝试次数较多，请稍后再试。');
}
export function ipBucket(request: NextRequest, action: string) {
  // Vercel overwrites x-vercel-forwarded-for. Do not trust arbitrary XFF elsewhere.
  const ip = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for') ?? 'unknown' : 'local';
  return `${action}:${tokenHash(ip)}`;
}
export interface DeviceSession { deviceId: string; childId: string; familyId: string; childName: string; familyName: string; authVersion: number; parent: boolean; parentExpiresAt: number | null }
export async function deviceSession(request: NextRequest): Promise<DeviceSession> {
  const token = request.cookies.get('kanto_device')?.value;
  if (!token || !/^[\w-]{43}$/.test(token)) throw new ApiError(401, 'DEVICE_REQUIRED', '请先连接家庭设备。');
  const client = db();
  const { data: device, error } = await client.from('kanto_devices').select('id,child_id').eq('token_hash', tokenHash(token)).is('revoked_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error) throw databaseError(error);
  if (!device) throw new ApiError(401, 'DEVICE_REQUIRED', '设备连接已失效，请重新连接。');
  const { data: child, error: childError } = await client.from('kanto_children').select('id,name,family_id').eq('id', device.child_id).single();
  if (childError) throw databaseError(childError);
  const { data: family, error: familyError } = await client.from('kanto_families').select('id,name,auth_version').eq('id', child.family_id).single();
  if (familyError) throw databaseError(familyError);
  const config = getRuntimeConfig()!;
  const parentExpiresAt = parentSessionExpiry(request.cookies.get('kanto_parent')?.value ?? '', device.id, family.auth_version, config.sessionSecret);
  return { deviceId: device.id, childId: child.id, familyId: family.id, childName: child.name, familyName: family.name, authVersion: family.auth_version,
    parent: parentExpiresAt !== null, parentExpiresAt };
}
export async function parentSession(request: NextRequest) {
  const session = await deviceSession(request);
  if (!session.parent) throw new ApiError(403, 'PIN_REQUIRED', '请先输入家长 PIN 解锁。');
  return session;
}
export const cookieOptions = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
export async function handle(callback: () => Promise<NextResponse>) {
  try { return await callback(); } catch (error) {
    if (error instanceof ApiError) return reply({ error: error.message, code: error.code }, error.status);
    return reply({ error: '这次操作暂时没有完成，请重试。已成功的奖励不会重复消耗。', code: 'UNEXPECTED' }, 503);
  }
}
