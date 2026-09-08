'use client';
export class RequestError extends Error {
  constructor(message: string, public code: string, public status: number) { super(message); }
}
export async function api<T>(path: string, body?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  } catch { throw new RequestError('连接中断，请重试。已成功的奖励会返回原来的结果。', 'NETWORK', 0); }
  let result;
  try { result = await response.json(); } catch { throw new RequestError('暂时无法读取手帐，请稍后重试。', 'RESPONSE', response.status); }
  if (!response.ok) {
    if (result.code === 'PIN_REQUIRED') window.dispatchEvent(new Event('kanto-parent-locked'));
    if (result.code === 'DEVICE_REQUIRED') window.dispatchEvent(new Event('kanto-device-lost'));
    throw new RequestError(result.error ?? '操作没有完成，请重试。', result.code ?? 'UNKNOWN', response.status);
  }
  return result as T;
}
