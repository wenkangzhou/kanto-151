import { loadEnvConfig } from '@next/env';
import { appendFileSync, chmodSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const names = ['APP_SESSION_SECRET', 'APP_SETUP_TOKEN'];
const missing = names.filter(name => !process.env[name]?.trim());
if (missing.length) {
  appendFileSync('.env.local', '\n# Kanto family session / first-time setup. Server only.\n' + missing.map(name => `${name}=${randomBytes(32).toString('base64url')}`).join('\n') + '\n', { mode: 0o600 });
  chmodSync('.env.local', 0o600);
  console.log(`已在被 Git 忽略的 .env.local 中生成 ${missing.join('、')}，未输出密钥值。`);
} else { console.log('应用密钥已存在，未覆盖。'); }
