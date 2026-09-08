import { loadEnvConfig } from '@next/env';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSupabaseConfig } from '../src/lib/supabase/config';
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const config = parseSupabaseConfig(process.env, { allowEmpty: true });
if (config) {
  const values = [...new Set([process.env.SUPABASE_URL?.trim(), config.url, config.publishableKey, config.secretKey, process.env.APP_SESSION_SECRET?.trim(), process.env.APP_SETUP_TOKEN?.trim()].filter((value): value is string => Boolean(value)))];
  const variants = values.flatMap(value => [value, JSON.stringify(value).slice(1, -1), encodeURIComponent(value)]);
  let count = 0;
  const scan = (directory: string, extensions: RegExp) => {
    if (!existsSync(directory)) throw new Error('未找到构建产物，请先运行 npm run build。');
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) scan(path, extensions);
      else if (extensions.test(entry.name)) {
        count++;
        const content = readFileSync(path, 'utf8');
        if (variants.some(value => content.includes(value))) {
          throw new Error('构建检查失败：公开产物包含服务端配置值，请检查服务端与客户端边界。');
        }
      }
    }
  };
  scan('.next/static', /\.(js|css|json|map)$/);
  scan('.next/server/app', /\.(html|rsc|txt|body)$/);
  scan('public', /\.(html|js|json|txt|map)$/);
  console.log(`公开构建产物检查通过：${count} 个文件未包含五项服务端配置值。`);
} else {
  console.log('示例模式：没有 Supabase 配置值需要检查。');
}
