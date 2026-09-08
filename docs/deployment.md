# 部署到 Vercel：家庭奖励版

这一阶段已接入真实收藏、奖励码、背包券、捕捉与进化。一个部署 / Supabase 项目对应一个家庭、一个孩子；多个设备共享这份手帐。家庭认证采用设备连接凭据与家长 PIN，不需要邮箱登录或 Supabase Auth 回调配置。

## 1. 执行数据库迁移

打开 Supabase 项目 → SQL Editor → New query，复制仓库中的整个文件：

[`supabase/migrations/202609080001_family_rewards.sql`](../supabase/migrations/202609080001_family_rewards.sql)

点击 Run，成功后无需重复执行。请保留文件的 `begin` 和 `commit`，不要分段运行。它只新建 `kanto_` 前缀的表与函数，不删除已有数据，不导入示例收藏。此脚本是首次迁移，重复执行会因对象已存在而报错；后续更新使用新的迁移文件。

SQL 已在本地 PGlite PostgreSQL 环境验证；开发过程中没有替你执行云端迁移。网页出现「家庭手帐尚未初始化，请家长先完成数据库配置」时，先检查是否执行了此文件以及 Supabase 配置是否指向同一个项目。

数据库规则由仓库 JSON 生成，涉及章节、进化父子编号和探索权重，不复制名字、种族值等元数据。表启用 RLS，并撤销匿名用户与 authenticated 角色的表 / RPC 权限。业务仅由验证了家庭设备与家长权限的 Next.js 服务端调用。

## 2. 配置五项环境变量

名称均不能添加 `NEXT_PUBLIC_`：

| 名称 | 填入的值 |
| --- | --- |
| `SUPABASE_URL` | Supabase 项目的 HTTPS 根地址 |
| `SUPABASE_PUBLISHABLE_KEY` | 新版 `sb_publishable_` 开头的 key |
| `SUPABASE_SECRET_KEY` | 新版 `sb_secret_` 开头的 key |
| `APP_SESSION_SECRET` | 家长会话签名密钥，独立随机字符串，至少 40 字符 |
| `APP_SETUP_TOKEN` | 家长首次初始化 / 忘记 PIN 时使用的口令，另一个独立随机字符串，至少 40 字符 |

你已填写的前三项保留在本地 `.env`。本次已使用安全随机数在被 Git 忽略的 `.env.local` 生成后两项；打开该文件复制到 Vercel，值无需粘贴到聊天中。没有这些密钥的新开发环境可运行：

```bash
npm run setup:secrets
npm run check:env
```

生成命令只补充缺失项，不覆盖已有密钥，不输出值。真实 `.env*` 文件不会上传 GitHub，也不会自动同步到 Vercel。仅 `.env.example` 的空模板提交 Git。

在 Vercel 导入 GitHub 项目时，将五项值添加到 Environment Variables 的 **Production** 范围。Preview 需要真实数据时使用另一套测试 Supabase 项目及独立应用密钥；纯示例预览可完全不配置 Supabase 三项。部分缺失或格式错误会阻止构建。

`APP_SETUP_TOKEN` 是家庭访问恢复口令，请由家长保管。更换 `APP_SESSION_SECRET` 并重新部署会使已有家长解锁失效，但配对设备和收藏仍然保留。更换 `APP_SETUP_TOKEN` 只改变首次设置 / 恢复口令，不会删除家庭或修改已设置 PIN。

## 3. GitHub → Vercel

1. 上传项目到 GitHub，包含 lockfile、`src/data`、`public`、`supabase/migrations`；不上传真实配置、`node_modules` 或 `.next`。
2. 在 Vercel 导入仓库，Root Directory 指向本项目根目录。
3. 使用仓库 `vercel.json`：Next.js、Node.js 22.x、`npm ci`、`npm run verify && npm run build`。输出目录保持默认，不设置端口。
4. 填好上述五项变量后 Deploy。后续向 Production Branch 推送会自动部署；修改环境变量后也需要重新部署。

本地开发与 `npm start` 使用 **42751**；Vercel 地址使用 HTTPS，不受该端口影响。构建包含 lint、业务与 SQL 测试、环境校验、TypeScript 检查，并扫描公开脚本、HTML、RSC 与 public 文本，确认不包含五项实际配置值。

## 4. 首次创建家庭

1. 部署后访问 `/setup`。
2. 输入 `APP_SETUP_TOKEN` 的值、家庭名称、孩子昵称，设置六位家长 PIN。
3. 成功后进入家长空间。初始收藏为 0，不会导入示例的十只宝可梦。
4. 在「家庭概览」生成设备连接码。在孩子的手机 / 平板访问同一个域名的 `/connect`，输入 **12 位字母数字连接码**并起一个设备名。
5. 连接码仅一次有效，15 分钟到期。设备连接有效期 180 天，可在家长空间解除连接；清空浏览器数据或换域名后需要重新连接。

日常只需在已连接设备的 `/parent` 输入六位 PIN，解锁家长操作 15 分钟。家长用完可点击「锁定」，孩子设备不需要知道 PIN。忘记 PIN 或丢失所有已连接设备时，在 `/setup` 选择「已有家庭 / 忘记 PIN」，使用初始化口令恢复；已有收藏保留，旧家长会话失效。

## 5. 第一次真实使用

1. 家长选择捕捉 / 进化 / 传说奖励，附上成长理由，生成 **六位数字奖励码**。
2. 孩子进入 `/capture` 兑换。捕捉目标在此时由数据库选择；进化和传说奖励先存为券。
3. 捕捉结果先持久化，再播放可跳过的动画。刷新、用同一码重试会读取同一个结果，不会重新选择或重复扣券。
4. 在 `/bag` 选择具体的券和符合条件的目标，确认后开启进化或传说相遇。原有形态保留，每张券的理由随新形态写入成长足迹。
5. 前 150 位伙伴收齐后，兑换页自动出现梦幻的最终相遇入口，无需券。

奖励码 30 天内可首次兑换，家长可以撤销未兑换的码；已进入背包的券不设过期时间。奖励码、连接码、PIN 入口都有服务端限速。奖励记录中已过期、已撤销和已兑换状态分开显示。

## 手机安装与离线

部署后用 HTTPS 地址访问。支持安装事件的浏览器提供安装按钮；iPhone 使用 Safari 分享菜单「添加到主屏幕」。PWA 缓存公开脚本、Logo 与已加载插画，**不缓存 HTML、家庭接口或家长页面**。普通页面离线访问显示离线提示；兑换、查看真实收藏和家长操作需要联网。新 Service Worker 会清除旧版图鉴 HTML 缓存。

## 验证边界

本地测试覆盖 PostgreSQL 迁移、角色访问限制、奖励创建重试、兑换去重、空池、章节推进、伊布分支、传说与梦幻条件、PIN 哈希、会话签名和 PWA 缓存限制。PGlite 是单连接测试环境，不代表已经完成多连接并发压力测试。云端真实操作及手机安装应在你执行迁移和部署后，按上面的首次使用流程验收。

参考：[Vercel GitHub 集成](https://vercel.com/docs/git/vercel-for-github)、[环境变量](https://vercel.com/docs/environment-variables)、[Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys)。
