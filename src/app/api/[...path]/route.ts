import { randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { getRuntimeConfig } from '@/lib/server/runtime-config';
import { constantEqual, hashPin, randomToken, signParentSession, tokenHash, verifyPin } from '@/lib/server/security';
import { ApiError, assertMutation, body, cookieOptions, databaseError, db, deviceSession, handle, ipBucket, limit, parentSession, pin, reply, rpc, text, uuid } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return handle(async () => {
    const path = (await context.params).path.join('/');
    const config = getRuntimeConfig();
    if (!config) {
      if (path === 'session') return reply({ status: 'demo' });
      throw new ApiError(503, 'DEMO', '示例模式不处理真实奖励。');
    }
    if (path === 'session') {
      try {
        const session = await deviceSession(request);
        const snapshot = await rpc('kanto_snapshot', { p_child_id: session.childId });
        return reply({ status: 'ready', familyName: session.familyName, childName: session.childName, parent: session.parent, parentExpiresAt: session.parentExpiresAt, snapshot });
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== 'DEVICE_REQUIRED') throw error;
        const { data, error: dbError } = await db().from('kanto_families').select('id').limit(1);
        if (dbError) throw databaseError(dbError);
        return reply({ status: data.length ? 'unpaired' : 'setup-required' });
      }
    }
    if (path.startsWith('receipts/')) {
      const session = await deviceSession(request);
      const id = uuid(path.slice('receipts/'.length));
      const { data, error } = await db().from('kanto_receipts').select('*').eq('id', id).eq('child_id', session.childId).maybeSingle();
      if (error) throw databaseError(error);
      if (!data) throw new ApiError(404, 'NOT_FOUND', '没有找到这次相遇。');
      return reply(data);
    }
    if (path === 'parent/rewards') {
      const session = await parentSession(request);
      const page = Number(request.nextUrl.searchParams.get('page') ?? 0);
      if (!Number.isInteger(page) || page < 0 || page > 100000) throw new ApiError(400, 'INPUT', '页码不正确。');
      const { data, error } = await db().from('kanto_reward_codes').select('id,code,type,reason,created_at,expires_at,redeemed_at,revoked_at').eq('child_id', session.childId).order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * 30, page * 30 + 30);
      if (error) throw databaseError(error);
      return reply({ rewards: data.slice(0, 30), hasMore: data.length > 30 });
    }
    if (path === 'parent/devices') {
      const session = await parentSession(request);
      const { data, error } = await db().from('kanto_devices').select('id,name,created_at,expires_at').eq('child_id', session.childId).is('revoked_at', null).gt('expires_at', new Date().toISOString()).order('created_at');
      if (error) throw databaseError(error);
      return reply({ devices: data, currentId: session.deviceId });
    }
    throw new ApiError(404, 'NOT_FOUND', '没有这个入口。');
  });
}

export async function POST(request: NextRequest, context: Context) {
  return handle(async () => {
    assertMutation(request);
    const path = (await context.params).path.join('/');
    const config = getRuntimeConfig();
    if (!config) throw new ApiError(503, 'DEMO', '示例模式不处理真实奖励。');
    const input = await body(request);
    if (path === 'setup' || path === 'recover') {
      await limit(ipBucket(request, 'setup'), 10, 3600);
      if (!constantEqual(text(input, 'setupToken', 200), config.setupToken)) throw new ApiError(403, 'SETUP_TOKEN', '初始化口令不正确。');
      const token = randomToken();
      const pinHash = await hashPin(pin(input));
      const deviceId = path === 'setup'
        ? await rpc<string>('kanto_setup', { p_family_name: text(input, 'familyName', 40), p_child_name: text(input, 'childName', 30), p_pin_hash: pinHash, p_token_hash: tokenHash(token) })
        : await rpc<string>('kanto_recover', { p_pin_hash: pinHash, p_token_hash: tokenHash(token) });
      // Read only the new auth version, never send the PIN hash to the browser.
      const { data: family, error } = await db().from('kanto_families').select('auth_version').single();
      if (error) throw databaseError(error);
      const response = reply({ ok: true });
      response.cookies.set('kanto_device', token, { ...cookieOptions, maxAge: 180 * 24 * 3600 });
      response.cookies.set('kanto_parent', signParentSession(deviceId, family.auth_version, config.sessionSecret), { ...cookieOptions, maxAge: 900 });
      return response;
    }
    if (path === 'pair') {
      await limit(ipBucket(request, 'pair'), 15);
      const code = text(input, 'code', 20).replace(/[\s-]/g, '').toUpperCase();
      if (!/^[A-F0-9]{12}$/.test(code)) throw new ApiError(400, 'INPUT', '请输入完整的 12 位设备连接码。');
      const token = randomToken();
      await rpc('kanto_pair', { p_code_hash: tokenHash(code), p_token_hash: tokenHash(token), p_name: text(input, 'deviceName', 40) });
      const response = reply({ ok: true });
      response.cookies.set('kanto_device', token, { ...cookieOptions, maxAge: 180 * 24 * 3600 });
      response.cookies.set('kanto_parent', '', { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (path === 'parent/unlock') {
      const session = await deviceSession(request);
      await limit(`pin:${session.familyId}`, 10);
      const { data: family, error } = await db().from('kanto_families').select('pin_hash,auth_version').eq('id', session.familyId).single();
      if (error) throw databaseError(error);
      if (!await verifyPin(pin(input), family.pin_hash)) throw new ApiError(403, 'PIN_INVALID', 'PIN 不正确，请再试一次。');
      const response = reply({ ok: true });
      response.cookies.set('kanto_parent', signParentSession(session.deviceId, family.auth_version, config.sessionSecret), { ...cookieOptions, maxAge: 900 });
      return response;
    }
    if (path === 'parent/lock') {
      const response = reply({ ok: true });
      response.cookies.set('kanto_parent', '', { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (path === 'disconnect') {
      const session = await deviceSession(request);
      const { error } = await db().from('kanto_devices').update({ revoked_at: new Date().toISOString() }).eq('id', session.deviceId).eq('child_id', session.childId);
      if (error) throw databaseError(error);
      const response = reply({ ok: true });
      response.cookies.set('kanto_device', '', { ...cookieOptions, maxAge: 0 });
      response.cookies.set('kanto_parent', '', { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (path === 'redeem') {
      const session = await deviceSession(request);
      await limit(`redeem:${session.childId}`, 30);
      const code = text(input, 'code', 6, 6);
      if (!/^\d{6}$/.test(code)) throw new ApiError(400, 'INPUT', '奖励码需要是六位数字。');
      return reply(await rpc('kanto_redeem', { p_child_id: session.childId, p_code: code }));
    }
    if (path === 'tickets/use') {
      const session = await deviceSession(request);
      await limit(`ticket:${session.childId}`, 40);
      if (!Number.isInteger(input.targetId) || Number(input.targetId) < 1 || Number(input.targetId) > 151) throw new ApiError(400, 'INPUT', '请选择有效的伙伴。');
      return reply(await rpc('kanto_use_ticket', { p_child_id: session.childId, p_ticket_id: uuid(input.ticketId), p_target: input.targetId }));
    }
    if (path === 'mew') {
      const session = await deviceSession(request);
      await limit(`mew:${session.childId}`, 20);
      return reply(await rpc('kanto_meet_mew', { p_child_id: session.childId }));
    }
    if (path === 'receipts/acknowledge') {
      const session = await deviceSession(request);
      const { error } = await db().from('kanto_receipts').update({ acknowledged_at: new Date().toISOString() }).eq('id', uuid(input.id)).eq('child_id', session.childId);
      if (error) throw databaseError(error);
      return reply({ ok: true });
    }
    if (path === 'parent/rewards') {
      const session = await parentSession(request);
      await limit(`create:${session.childId}`, 60, 3600);
      const type = text(input, 'type', 12);
      if (!['capture', 'evolution', 'legendary'].includes(type)) throw new ApiError(400, 'INPUT', '请选择奖励类型。');
      return reply(await rpc('kanto_create_reward', { p_child_id: session.childId, p_request_id: uuid(input.requestId), p_type: type, p_reason: text(input, 'reason', 160, 0) }));
    }
    if (path === 'parent/rewards/revoke') {
      const session = await parentSession(request);
      const { data, error } = await db().from('kanto_reward_codes').update({ revoked_at: new Date().toISOString() }).eq('id', uuid(input.id)).eq('child_id', session.childId).is('redeemed_at', null).select('id');
      if (error) throw databaseError(error);
      if (!data.length) throw new ApiError(409, 'USED', '这份奖励已兑换或不存在，无法撤销。');
      return reply({ ok: true });
    }
    if (path === 'parent/pairing') {
      const session = await parentSession(request);
      await limit(`pairing:${session.childId}`, 20, 3600);
      const code = randomBytes(6).toString('hex').toUpperCase();
      const { data, error } = await db().from('kanto_pairing_codes').insert({ child_id: session.childId, code_hash: tokenHash(code) }).select('expires_at').single();
      if (error) throw databaseError(error);
      return reply({ code, expiresAt: data.expires_at });
    }
    if (path === 'parent/devices/revoke') {
      const session = await parentSession(request);
      const id = uuid(input.id);
      if (id === session.deviceId) throw new ApiError(400, 'CURRENT_DEVICE', '当前设备请使用退出连接。');
      const { error } = await db().from('kanto_devices').update({ revoked_at: new Date().toISOString() }).eq('id', id).eq('child_id', session.childId);
      if (error) throw databaseError(error);
      return reply({ ok: true });
    }
    throw new ApiError(404, 'NOT_FOUND', '没有这个入口。');
  });
}
