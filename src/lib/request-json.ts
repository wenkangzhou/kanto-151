export class RequestError extends Error {
  constructor(message: string, public code: string, public status: number) { super(message); }
}
// Cover both response headers and the body. Never automatically replay mutations.
export async function requestJson(url: string, init: RequestInit, timeoutMs = 15000): Promise<{response: Response; result: Record<string, unknown>}> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (init.signal?.aborted) throw new RequestError('请求已取消。', 'ABORTED', 0);
  init.signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, {...init, signal: controller.signal});
    let result;
    try { result = await response.json(); }
    catch (error) {
      if (controller.signal.aborted) throw error;
      throw new RequestError('暂时无法读取手帐，请重试。', 'RESPONSE', response.status);
    }
    if (!result || typeof result !== 'object') throw new RequestError('手帐返回内容不完整，请重试。', 'RESPONSE', response.status);
    return { response, result };
  } catch (error) {
    if (timedOut) throw new RequestError(init.method === 'POST' ? '网络较慢，暂未确认结果。领取奖励请保留原奖励码，用同一码重试。' : '网络较慢，读取超时了，请重试。', 'TIMEOUT', 0);
    if (init.signal?.aborted) throw new RequestError('请求已取消。', 'ABORTED', 0);
    if (error instanceof RequestError) throw error;
    throw new RequestError('连接中断，请重试。领取奖励时，请继续使用原奖励码。', 'NETWORK', 0);
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', cancel);
  }
}
