# Kanto 151

一本属于家庭的关都冒险手帐。把真实生活中的成长，珍藏为与最初 151 只宝可梦的相遇。

## 体验与功能

面向孩子与家长共同使用：孩子在 iPad 上探索、收集与对战，家长在手机上记录成长、发放奖励。一个部署对应一个家庭、一个孩子，多设备共享。

- **动画路线**：普通相遇按《宝可梦·无印篇》关都主要故事顺序推进，从皮卡丘开始，跳过已收集伙伴；图鉴保留全国编号。进化形态通过进化券获得，传说伙伴有独立条件。
- **图鉴与详情**：本地保存最初 151 只宝可梦的名字、插画、介绍、属性、种族值与进化关系；未发现伙伴显示剪影。详情支持左右切换已收集伙伴，返回图鉴保留筛选与浏览位置，包含人物参照的体型示意。
- **我的小队**：最多携带六只，其余留在精灵中心；支持长按拖动排序。首页由小队伙伴轮流陪伴，可手动切换；相遇和进化后可直接安排入队。
- **奖励与成长足迹**：家长生成六位数字的相遇、进化或传说奖励码，记录奖励理由，查看领取和实际使用结果，撤销未使用奖励。孩子兑换后看开球动画、查看详情或加入小队；进化券和传说券在背包使用。
- **一对一友好对战**：从小队选一位出场，开战后不能换人；任意一方体力耗尽即结束。赛前可随机换对手并听名字，结束后可保留对手、恢复双方体力、重新选伙伴。按速度决定每轮先手，同速开场随机一次；配有可点读属性、投球出场、招式效果、扣血动画、胜负画面与本场招式回顾，不消耗奖励或道具。
- **浏览衔接**：伙伴详情保留首页、小队、成长足迹或奖励结果的返回入口；小队与精灵中心按当前范围翻看伙伴，返回保留筛选、排序和滚动位置。开球结果看完详情后可返回继续入队。
- **家长奖励草稿**：已解锁家长空间内切换页面时保留奖励理由、提交状态和生成结果；锁定、刷新或离开家长空间后清除临时草稿，已生成奖励仍可在记录中查看。
- **统一语音**：名字、介绍、属性说明、道具说明与对战台词采用 MiniMax 预生成配音；点文字旁播放按钮或属性／道具图片即可听取。使用完整句子，不运行时拼接；播放无需调用模型。
- **音乐与动画**：大屏背景乐、开球／进化／礼物音乐，以及对战与胜利音乐；音乐默认关闭。动画支持跳过和减少动态效果，开球等待点击超过 8 秒自动继续。
- **家庭与设备**：家庭初始化、设备配对、服务端家长 PIN 校验、短期家长会话和访问恢复。奖励通过数据库原子操作兑换，防止重复领取和刷新重选。
- **PWA**：可添加到主屏幕，桌面侧栏与手机底部导航适配；缓存公开静态资源，家庭数据与页面不做离线缓存。

未配置 Supabase 时为只读示例模式，默认展示十位伙伴；配置完整后使用真实家庭数据，初始收藏为零。对战采用儿童教学简化规则，不是原作完整战斗系统，详见 [对战说明](docs/battle.md)。

## 给访客体验

连接家庭页下方提供低调的“先体验一下演示”入口，也可直接分享部署后的 `/demo` 地址，无需家庭连接码。

演示使用独立模拟家庭：111 位伙伴、六只小队、进化券和传说券。可体验图鉴、组队、对战、奖励兑换、进化、传说相遇，以及家长发奖励与记录管理。顶部“演示冒险”展开后提供提示与入口：

- `111111`：开球奖励；`222222`：进化券；`333333`：传说券。
- 家长 PIN 为 `123456`，可在演示家长中心生成更多一次性奖励码。
- “体验集齐 150 位后的相遇”可查看梦幻最终相遇。
- “重置演示”恢复初始模拟数据，“退出演示”回到正常应用。

演示状态只保存在当前标签页的 `sessionStorage`，刷新保留，关闭标签页后通常清除。所有演示 API 在浏览器本地处理，不读取或修改真实家庭，不生成真实设备凭证；未知操作和存储异常不会回退到真实接口。初始化／恢复操作不在演示中执行。

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

1. 在 Supabase SQL Editor 执行一次 [`supabase/migrations/202609080001_family_rewards.sql`](supabase/migrations/202609080001_family_rewards.sql)。再执行 [`202609080002_chapter_discoveries.sql`](supabase/migrations/202609080002_chapter_discoveries.sql)。再执行 [`202609090003_anime_route.sql`](supabase/migrations/202609090003_anime_route.sql)。最后执行 [`202609090004_team.sql`](supabase/migrations/202609090004_team.sql)。已执行 `001`—`003` 的家庭只执行 `004`，然后部署对应代码。迁移不导入示例收藏。
2. 本地 `.env` 或 `.env.local` 填入 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`，使用新版 publishable / secret keys。
3. 运行 `npm run setup:secrets`，在被 Git 忽略的 `.env.local` 生成 `APP_SESSION_SECRET`、`APP_SETUP_TOKEN`。密钥只生成缺失项，不输出值。
4. 上传仓库到 GitHub，Vercel 导入仓库，使用项目根目录和仓库中的 `vercel.json`。把上述**五项变量**逐一添加到 Vercel Production，名称均不带 `NEXT_PUBLIC_`。本地真实配置不会随 Git 上传。
5. 部署后打开 `/setup`，输入 `APP_SETUP_TOKEN` 并设置家庭名称、孩子昵称、六位 PIN。家长空间可生成 12 位设备连接码，孩子设备在 `/connect` 输入后加入。
6. 家长生成六位数字奖励码，孩子到 `/capture` 兑换；进化 / 传说券在 `/bag` 使用。

不用配置 Supabase Auth、邮箱或登录回调。本地端口不需要填写到 Vercel。家长 PIN 忘记时，在 `/setup` 选择恢复入口，使用初始化口令重设，收藏保留。

Production 使用真实数据库；Preview 如需真实数据，使用另一套测试项目与密钥。纯示例预览可将 Supabase 三项全留空，不能只配一部分。

## 设备与数据

部署后通过 HTTPS 访问，可安装到主屏幕。iPhone 用 Safari 分享菜单「添加到主屏幕」。插画与脚本支持静态缓存；真实收藏、奖励与家长空间需要联网，HTML 和接口不做离线缓存。

```text
src/app/                  页面、PWA manifest、同源 API
src/components/           图鉴、小队、相遇动画与对战界面
src/domain/               收藏、小队、属性倍率与对战规则
src/data/                 151 JSON、章节、招式、语音索引与来源记录
src/lib/server/           家庭身份、PIN、限速、请求校验
src/lib/supabase/         服务端数据库客户端与配置校验
supabase/migrations/      数据库迁移与原子奖励 RPC
public/pokemon/           151 份本地插画
public/icons/             安装图标
public/audio/             已选用的音乐、音效与预生成语音
data/voice/               语音清单、生成记录与用量汇总
scripts/                  数据同步、配置与构建检查、SQL 规则生成
```

运行时不请求 PokéAPI。主动更新资料可运行 `npm run data:sync`；更新游戏规则后运行 `npm run sql:rules` 并为已部署数据库编写新的迁移，不能重跑首个迁移。架构与权限说明见 [architecture.md](docs/architecture.md)。

## 声音资源

**语音已随仓库提供，无需配置语音 API Key 即可运行或部署。**当前音色为 MiniMax `hunyin_6`，模型为 `speech-2.8-hd`。已制作 1,546 条音频，约 104 分钟、103 MB，按需加载；未使用浏览器系统朗读作为备用音色。试听地址：[/audio/voices/preview.html](http://localhost:42751/audio/voices/preview.html)。

只有补充或修改配音时，才需要在本地 `.env.local` 配置 `MINIMAX_AUDIO_TTS_API_KEY`，并安装 Python 3 与 FFmpeg。不要提交密钥，也不需要把这个 Key 配置到 Vercel。

```bash
node --import tsx scripts/voice-catalog.ts  # 整理完整句子，不调用接口
python3 scripts/generate-voices.py         # 查看已缓存与待生成数量，不调用接口
python3 scripts/generate-voices.py --generate  # 付费生成，仅处理缺失音频
python3 scripts/verify-voices.py           # 核对文件、更新索引与试听页
```

生成记录支持断点续作；不确定是否收费的失败请求需要核实后处理，不要删除记录后全量重跑。具体参数、恢复方式与目录说明见 [语音制作说明](docs/voices.md)。当前制作费用不随孩子的播放次数重复产生，托管流量另计。

背景音乐使用用户提供的《火红／叶绿》素材，选用文件已纳入仓库。完整专辑目录被 Git 忽略，后续使用其中曲目时复制所需文件即可。音乐开关适用于 iPad／桌面，手机不加载背景音乐；语音播放与该音乐开关分开。详见 [背景与场景音乐](docs/background-music.md) 和 [对战声音](docs/battle.md#对战声音)。

## 本地预览

下表中的 `/dev/capture` 动画预览仅在 `npm run dev` 下可用，生产环境返回 404。预览不会真实增加收藏、发放奖励或消耗进化券。

| 地址 | 用途 |
| --- | --- |
| `/dev/capture` | 模拟打开精灵球与新伙伴揭晓 |
| `/dev/capture?mode=evolution` | 模拟进化动画 |
| `/dev/capture?mode=ticket` | 模拟获得进化券到使用的流程 |
| `/audio/voices/preview.html` | 搜索、试听已生成的语音；此静态页面也随部署提供 |

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

宝可梦名称、角色与官方插画属于其各自权利人。本项目是非官方的家庭学习与收藏体验。精灵球主题 Logo 位于 `public/logo-pokeball.png`，提示词见 [Logo 记录](docs/logo-prompt.md)。

## 动画相遇路线

普通捕捉奖励按无印篇主要故事顺序获得，首次从皮卡丘开始，自动跳过已有收藏。图鉴编号不变，进化与传说券机制保留。详见 [动画路线与升级说明](docs/anime-route.md)。

更多资料：[设计原则](docs/design-principles.md)、[体型对比](docs/size-comparison.md)、[语音制作](docs/voices.md)、[一对一对战](docs/battle.md)。
