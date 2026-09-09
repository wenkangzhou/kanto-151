# Kanto 151

一本属于家庭的关都冒险手帐。把真实生活中的成长，珍藏为与最初 151 只宝可梦的相遇。

## 已实现

- 手机优先的首页、151 图鉴、详情、成长足迹和背包，桌面侧栏与手机底部导航。
- 本地多语言资料与插画、种族值、现行属性倍率、进化关系；未知伙伴显示剪影和编号。
- 家庭初始化、设备配对、服务端家长 PIN 校验、短期家长会话和访问恢复。
- 家长生成六位捕捉 / 进化 / 传说奖励码，填写理由，查看记录和撤销未用奖励。
- Supabase 原子兑换：不重复、不中途丢奖励、刷新不重选；成长理由永久随收藏保存。
- 孩子选择背包券、进化目标、传说伙伴；伊布三分支、章节推进与 150 只后的梦幻最终相遇。
- 提交结果后播放捕捉和进化动画，可跳过，支持减少动态效果，默认静音。
- 原创 Logo、可安装 PWA、公开静态资源缓存与离线提示；家庭数据与页面不缓存。

一个部署对应一个家庭、一个孩子，多设备共享。未配置 Supabase 时保留只读示例模式，默认十位示例伙伴；配置完整后使用真实家庭数据，初始收藏为零。

## 本地运行

Node.js 22.x，安装后使用非默认端口 **42751**：

```bash
npm ci
npm run dev
```

打开 [冒险首页](http://localhost:42751) 或 [图鉴](http://localhost:42751/pokedex)。真实模式先完成下述数据库与环境配置。

```bash
npm run build
npm start
```

`npm start` 同样使用 42751，需先停止开发服务。开发模式不注册 Service Worker。

## 首次配置与 GitHub → Vercel

完整操作见 [部署说明](docs/deployment.md)。

1. 在 Supabase SQL Editor 执行一次 [`supabase/migrations/202609080001_family_rewards.sql`](supabase/migrations/202609080001_family_rewards.sql)。再执行 [`202609080002_chapter_discoveries.sql`](supabase/migrations/202609080002_chapter_discoveries.sql)。已初始化的家庭只执行新迁移 `002`。迁移不导入示例收藏。
2. 本地 `.env` 或 `.env.local` 填入 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`，使用新版 publishable / secret keys。
3. 运行 `npm run setup:secrets`，在被 Git 忽略的 `.env.local` 生成 `APP_SESSION_SECRET`、`APP_SETUP_TOKEN`。密钥只生成缺失项，不输出值。
4. 上传仓库到 GitHub，Vercel 导入仓库，使用项目根目录和仓库中的 `vercel.json`。把上述**五项变量**逐一添加到 Vercel Production，名称均不带 `NEXT_PUBLIC_`。本地真实配置不会随 Git 上传。
5. 部署后打开 `/setup`，输入 `APP_SETUP_TOKEN` 并设置家庭名称、孩子昵称、六位 PIN。家长空间可生成 12 位设备连接码，孩子设备在 `/connect` 输入后加入。
6. 家长生成六位数字奖励码，孩子到 `/capture` 兑换；进化 / 传说券在 `/bag` 使用。

不用配置 Supabase Auth、邮箱或登录回调。本地端口不需要填写到 Vercel。家长 PIN 忘记时，在 `/setup` 选择恢复入口，使用初始化口令重设，收藏保留。

Production 使用真实数据库；Preview 如需真实数据，使用另一套测试项目与密钥。纯示例预览可将 Supabase 三项全留空，不能只配一部分。

## 手机与数据

部署后通过 HTTPS 访问，可安装到主屏幕。iPhone 用 Safari 分享菜单「添加到主屏幕」。插画与脚本支持静态缓存；真实收藏、奖励与家长空间需要联网，HTML 和接口不做离线缓存。

```text
src/app/                  页面、PWA manifest、同源 API
src/components/           界面与相遇动画
src/domain/               收藏规则、属性倍率、进化工具
src/data/                 151 JSON、章节、儿童简介与来源记录
src/lib/server/           家庭身份、PIN、限速、请求校验
src/lib/supabase/         服务端数据库客户端与配置校验
supabase/migrations/      数据库迁移与原子奖励 RPC
public/pokemon/           151 份本地插画
public/icons/             手机安装图标
scripts/                  数据同步、配置与构建检查、SQL 规则生成
```

运行时不请求 PokéAPI。主动更新资料可运行 `npm run data:sync`；更新游戏规则后运行 `npm run sql:rules` 并为已部署数据库编写新的迁移，不能重跑首个迁移。架构与权限说明见 [architecture.md](docs/architecture.md)。

## 大屏背景音乐

已接入 iPad / 桌面背景音乐开关，手机不加载音频。默认关闭，点按后循环播放，站内切页保持连续。当前尚缺原曲文件，添加方式见 [背景音乐说明](docs/background-music.md)。

## 验证

```bash
npm run check:env       # 校验五项服务端配置，不显示值
npm run check:supabase  # 联网读取服务元数据，不查询用户表、不写数据库
npm run verify         # lint、JSON/SQL 规则一致性、域规则 / PostgreSQL / 会话 / PWA 测试
npm run typecheck
npm run build          # 生产构建后扫描公开产物，检查实际配置值未泄漏
```

SQL 测试在本地 PGlite PostgreSQL 执行整份迁移及奖励生命周期，包括角色权限、重试、去重、回滚、进化、传说与梦幻。云端迁移、真实使用验收由首次部署流程完成；本地单连接测试不代表已进行多连接并发压力测试。

技术栈：Next.js App Router、React、TypeScript、Tailwind CSS、Framer Motion、Supabase。依赖精确版本与 lockfile 一起保存。

## 资源

元数据与插画来源于 [PokéAPI](https://pokeapi.co/docs/v2/) 及 [sprites 仓库](https://github.com/PokeAPI/sprites)。导入时间见 `src/data/provenance.json`；部分简介经项目改写以适合儿童阅读。

宝可梦名称、角色与官方插画属于其各自权利人。本项目是非官方的家庭学习与收藏体验。原创手帐 Logo 位于 `public/logo.png`，提示词见 [Logo 记录](docs/logo-prompt.md)。
