'use client';
import { isVisitorDemo } from './demo-mode';
import { requestJson, RequestError } from './request-json';
export { RequestError } from './request-json';
export async function api<T>(path: string, body?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (isVisitorDemo()) {
    if (signal?.aborted) throw new RequestError('请求已取消。', 'ABORTED', 0);
    const { demoApi } = await import('./demo-api');
    return demoApi(path, body) as T;
  }
  const {response,result} = await requestJson(`/api/${path}`, { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal,
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }, body ? 20000 : 15000);
  if (!response.ok) {
    if (result.code === 'PLAY_TIME_LOCKED') window.dispatchEvent(new Event('kanto-play-time-refresh'));
    if (result.code === 'PIN_REQUIRED') window.dispatchEvent(new Event('kanto-parent-locked'));
    if (result.code === 'DEVICE_REQUIRED') window.dispatchEvent(new Event('kanto-device-lost'));
    throw new RequestError(typeof result.error === 'string' ? result.error : '操作没有完成，请重试。', typeof result.code === 'string' ? result.code : 'UNKNOWN', response.status);
  }
  if(body&&['pair','recover','setup','disconnect'].includes(path))window.dispatchEvent(new Event('kanto-learning-reset'));
  return result as T;
}
