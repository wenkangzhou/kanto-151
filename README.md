# Kanto 151

一本属于家庭的关都冒险手帐。将真实生活中的成长，慢慢珍藏为与最初 151 只宝可梦的相遇。

## 第一版可以体验什么

- 手机优先的冒险首页、桌面侧边导航、手机底部导航。
- 151 只完整图鉴，搜索编号 / 已发现名称、按已收集 / 未发现 / 可进化 / 属性筛选、编号与相遇时间排序。
- 已收集宝可梦的简中、繁中、英文名，本地插画，现行属性与六维种族值，克制 / 弱点 / 抗性，进化关系，个人相遇理由。
- 未发现宝可梦使用剪影，不展示名字；直接访问未知伙伴详情也保持神秘。
- 收藏与章节的纯函数模块；伊布三分支、传说门槛、150 只后最终梦幻的规则测试。
- 示例背包和成长足迹。默认 10 位示例伙伴，右上角切换「全新图鉴」可体验空白状态。
- 原创 Logo、PWA manifest、192 / 512 图标和 Apple touch icon。生产模式启用 Service Worker，缓存看过的公开图鉴页面、脚本与插画，并提供离线兜底页。

**这是需求指定的图鉴第一阶段。奖励码生成 / 兑换、PIN 验证、真实进化 / 捕捉动画、Supabase 持久化尚未开放。** 相关入口清楚标明下一阶段内容，不会创建虚假奖励或真实家庭记录。已配置 Supabase 服务端客户端、环境变量校验和独立连接检查；当前页面仍使用示例数据，不执行数据库业务读写。

## 本地启动

需要 Node.js 22.x，已在 Node.js 22.22.0 验证。

```bash
npm ci
npm run dev
```

打开 [本地冒险首页](http://localhost:42751) 或 [宝可梦图鉴](http://localhost:42751/pokedex)。开发和本地生产服务均使用 **42751**，不是 3000。

```bash
npm run build
npm start
```

生产服务也占用 42751，因此先停止开发服务再运行 `npm start`。开发模式不注册 Service Worker，避免缓存干扰热更新。

## GitHub → Vercel

1. 把当前项目上传到你的 GitHub 仓库。一起提交 `package-lock.json`、`src/data/` 和 `public/`；不提交 `.env.local`、`node_modules`、`.next`。
2. 在 Vercel 新建项目并导入该 GitHub 仓库。项目位于仓库根目录时，Root Directory 保持默认。
3. 仓库的 `vercel.json` 已指定 Next.js、`npm ci` 和 `npm run verify && npm run build`。保持输出目录默认，Node.js 使用 22.x。构建前会运行 lint、测试和配置校验。
4. 在 Vercel 的 Environment Variables 中分别添加 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`，复制你本地已填写的对应值，选择 Production。需要 Preview 数据库连接时为 Preview 配置一套独立测试项目的值；不接数据库的纯图鉴预览可以三项全部留空。不要只填写一部分。本地 `.env` 不会通过 Git 自动同步到 Vercel。
5. 部署后，向所选 Production Branch 推送更新会触发自动部署。Vercel 托管地址使用 HTTPS，本地的 42751 无需在 Vercel 配置。

参考：[Vercel GitHub 集成](https://vercel.com/docs/git/vercel-for-github)、[Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)。

当前网站是无登录的示例图鉴，`noindex` 仅影响搜索索引，不是访问控制。进入真实家庭使用前，需要完成第二阶段的家庭认证和权限隔离。

## 手机安装与离线

使用部署后的 HTTPS 地址，或本机 localhost 的生产服务进行验证。Android / Chromium 支持安装事件时，顶栏出现「安装」按钮；iPhone 可在 Safari 分享菜单中选择「添加到主屏幕」。

第一次在线访问后，Service Worker 开始保存公开浏览内容。离线能力覆盖已访问页面及已加载资源；从未打开的详情页会显示离线提示，不承诺首次离线就能浏览全部图鉴。奖励和家长路径不纳入离线数据缓存。

本版没有音频，默认为完全静音。动效遵循系统的「减少动态效果」。

## 数据与结构

```text
src/app/                 页面路由、元数据、PWA manifest
src/components/          可复用界面组件
src/domain/              收藏规则、属性克制、图鉴与进化工具
src/data/                151 JSON、章节、示例记录、儿童版简介、来源记录
src/lib/supabase/        下一阶段接入边界说明
public/pokemon/          151 份本地插画
public/icons/            PWA 图标
public/sw.js             公开浏览缓存
scripts/sync-pokemon.py   仅开发期运行的数据导入器
```

运行时没有 PokéAPI 请求；资料与图像均已提交在仓库。需要主动更新资料时，可联网执行 `npm run data:sync`。导入器缓存原始响应，保留 `src/data/descriptions.json` 中经过儿童阅读调整的简介。

技术栈：Next.js 16.3.4 App Router、React 19、TypeScript、Tailwind CSS 4、Framer Motion、Supabase SDK。依赖精确版本和 lockfile 一起保存。

详细规则、安全边界与下一阶段 RPC 设计见 [架构说明](docs/architecture.md)。

Supabase 环境变量统一为 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`，全部仅在服务端使用，不添加 `NEXT_PUBLIC_` 前缀。未来浏览器通过 Next.js 服务端接口访问业务功能，不直接连接 Supabase。

## SQL

**第一版无需执行 SQL。纯示例部署可将三项 Supabase 配置全部留空；已准备 Supabase 时应完整填写三项。** 下一阶段应一起交付家庭身份、RLS、服务端 PIN 和原子奖励 RPC 的完整迁移。不要先建一个允许客户端直接写收藏的临时数据库。

## 验证

```bash
npm run check:env       # 严格检查三项变量，只显示结果，不显示值
npm run check:supabase  # 可选：联网检查密钥与服务连接，不查询用户记录、不写数据库
npm run lint
npm run typecheck
npm test
npm run build
```

已验证静态数据完整性、现行与历史属性差异、双属性倍率与免疫、章节与去重边界、伊布分支、传说门槛及梦幻最终条件。生产构建会生成全部 151 个详情页。构建完成后自动扫描公开脚本、HTML、RSC 和 public 文本资源，确认不含已配置的 Supabase 地址或密钥。此检查是额外防线，业务代码仍需保持服务端边界。

部署时可直接照着 [部署配置说明](docs/deployment.md) 操作。

## 资源

元数据与插画来源于 [PokéAPI](https://pokeapi.co/docs/v2/) 及其 [sprites 仓库](https://github.com/PokeAPI/sprites)。每条记录保留 artworkSource，导入时间见 `src/data/provenance.json`。部分简介经本项目改写以适合儿童阅读。

宝可梦名称、角色与官方插画属于其各自权利人。本项目是非官方的家庭学习与收藏体验。原创手帐 Logo 位于 `public/logo.png`，生成方式与提示词见 [Logo 记录](docs/logo-prompt.md)。
