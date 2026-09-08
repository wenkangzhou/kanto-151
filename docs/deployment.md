# 部署这版到 Vercel

## 已准备的项目配置

- Node.js 22.x；安装 `npm ci`，锁定依赖版本。
- `vercel.json` 指定 Next.js 与构建命令 `npm run verify && npm run build`。
- 自动执行 lint、单元测试、环境变量校验、TypeScript 与生产构建；构建后检查公开产物是否包含 Supabase 配置值。
- PWA manifest、手机安装图标、Service Worker 和缓存控制已配置。
- `.env`、`.env.local` 等真实配置被 Git 忽略，只提交空值的 `.env.example`。
- 本地端口 42751；Vercel 不需要设置这个端口。

## 在 Vercel 填什么

导入 GitHub 仓库时，Root Directory 选项目根目录。框架、安装和构建命令使用仓库配置，输出目录保持默认。

在 Environment Variables 中增加以下三项，名称不能带 `NEXT_PUBLIC_`：

| 名称 | 对应值 |
| --- | --- |
| `SUPABASE_URL` | Supabase 项目的 HTTPS 根地址 |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_` 开头的新版 publishable key |
| `SUPABASE_SECRET_KEY` | `sb_secret_` 开头的新版 secret key |

本地已经填写的 `.env` 不会上传 GitHub，也不会自动出现在 Vercel；需要在 Vercel 中填入对应值。生产部署选择 Production 范围。Preview 需要数据库时使用独立测试 Supabase 项目，纯示例预览可以三项全部留空。三项只填一部分会让构建失败，以免留下无法使用的半套配置。

在 Supabase 项目 **Settings → API Keys → Publishable and secret API keys** 找到新版密钥。Secret key 仅存于本地忽略文件或 Vercel 环境变量，不放进代码。

设置完成后 Deploy。如果修改的是已部署项目的环境变量，需要重新部署才能应用新的值。

## 发布后

1. 打开 `/pokedex` 与 `/pokemon/2`，确认页面和插画正常。
2. 手机用 HTTPS 地址访问；支持安装事件的浏览器会显示安装按钮，iPhone 可用 Safari 分享菜单添加到主屏幕。
3. 首次在线访问后再测试已看过页面的离线浏览。尚未缓存的页面会出现离线提示。

## Supabase 和 SQL 的边界

当前页面是示例图鉴，服务端连接配置准备好了，尚未接入真实家庭记录。现在不需要执行 SQL，也不需要设置不存在的登录回调地址。真正启用家庭账号时，再按实际部署域名配置 Supabase Auth 的 Site URL / Redirect URLs，并一起交付家庭权限、表结构和奖励 RPC。

本版的 `noindex` 是搜索索引设置，不是私有访问认证。

官方参考：[Vercel 环境变量](https://vercel.com/docs/environment-variables)、[Vercel 项目配置](https://vercel.com/docs/project-configuration)、[Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys)。
