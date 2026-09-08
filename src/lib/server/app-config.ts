import { SupabaseConfigError } from '../supabase/config';

/** Pure validation. Call only from server/runtime tooling; never return to a client. */
export function parseAppConfig(env: Record<string, string | undefined>) {
  if (Object.keys(env).some(name => name.startsWith('NEXT_PUBLIC_APP_'))) {
    throw new SupabaseConfigError('应用密钥禁止使用 NEXT_PUBLIC_ 前缀。');
  }
  const sessionSecret = env.APP_SESSION_SECRET?.trim();
  const setupToken = env.APP_SETUP_TOKEN?.trim();
  if (!sessionSecret || sessionSecret.length < 40 || !setupToken || setupToken.length < 40 || sessionSecret === setupToken) {
    throw new SupabaseConfigError('请配置不同的 APP_SESSION_SECRET 和 APP_SETUP_TOKEN（至少 40 字符），可运行 npm run setup:secrets 生成。');
  }
  return { sessionSecret, setupToken };
}
