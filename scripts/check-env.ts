import { loadEnvConfig } from '@next/env';
import { parseSupabaseConfig, SupabaseConfigError } from '../src/lib/supabase/config';
import { parseAppConfig } from '../src/lib/server/app-config';

async function main() {
// Match next build's production env precedence. Never log dotenv contents/errors.
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
try {
  const config = parseSupabaseConfig(process.env, { allowEmpty: process.argv.includes('--allow-empty') });
  if (config) parseAppConfig(process.env);
  console.log(config ? 'Supabase 与家庭应用的五项服务端配置检查通过（未输出配置值）。' : '未配置 Supabase：以示例图鉴模式构建。');
  if (process.argv.includes('--connect')) {
    if (!config) throw new SupabaseConfigError('连接检查需要完整 Supabase 配置。');
    // Read API metadata only. Never query user data or write to the database.
    for (const [label, path, key] of [
      ['Publishable key', '/auth/v1/settings', config.publishableKey],
      ['Secret key', '/rest/v1/', config.secretKey],
    ]) {
      const response = await fetch(new URL(path, config.url), {
        headers: { apikey: key },
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      });
      await response.body?.cancel();
      if (!response.ok) throw new SupabaseConfigError(`${label} 连接检查失败（HTTP ${response.status}）。请检查项目状态和对应密钥。`);
      console.log(`${label}：服务响应正常。`);
    }
  }
} catch (error) {
  console.error(error instanceof SupabaseConfigError ? error.message : 'Supabase 检查失败：请检查网络或项目状态（诊断信息已隐藏配置值）。');
  process.exitCode = 1;
}

}
void main();
