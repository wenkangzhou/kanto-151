/** Pure validation only: reading process.env belongs in server-only callers. */
export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  secretKey: string;
}
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}
export function parseSupabaseConfig(
  env: Record<string, string | undefined>,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): SupabaseConfig | null {
  if (Object.keys(env).some(name => name.startsWith('NEXT_PUBLIC_') && name.includes('SUPABASE'))) {
    throw new SupabaseConfigError('Supabase 配置禁止使用 NEXT_PUBLIC_ 前缀。');
  }
  if (env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new SupabaseConfigError('请移除旧 SUPABASE_SERVICE_ROLE_KEY，改用新版 SUPABASE_SECRET_KEY。');
  }
  const names = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'] as const;
  const values = names.map(name => env[name]?.trim() ?? '');
  if (allowEmpty && values.every(value => !value)) return null;
  const missing = names.filter((_, index) => !values[index]);
  if (missing.length) throw new SupabaseConfigError(`缺少环境变量：${missing.join('、')}。`);
  let url: URL;
  try { url = new URL(values[0]); } catch {
    throw new SupabaseConfigError('SUPABASE_URL 必须是有效的 HTTPS 项目地址。');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new SupabaseConfigError('SUPABASE_URL 必须是 HTTPS 项目根地址，不含账号、路径、查询参数或片段。');
  }
  if (!/^sb_publishable_\S+$/.test(values[1])) {
    throw new SupabaseConfigError('SUPABASE_PUBLISHABLE_KEY 必须使用新版 sb_publishable_ 格式。');
  }
  if (!/^sb_secret_\S+$/.test(values[2])) {
    throw new SupabaseConfigError('SUPABASE_SECRET_KEY 必须使用新版 sb_secret_ 格式。');
  }
  return { url: url.origin, publishableKey: values[1], secretKey: values[2] };
}
