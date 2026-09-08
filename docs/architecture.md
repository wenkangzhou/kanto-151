# Kanto 151 第一版架构

## 本次范围

落实原始需求的 First Implementation Milestone：Next.js App Router、完整 151 JSON 数据、图鉴、详情、当前属性倍率、收藏状态、移动端响应式。加上首页、背包/成长足迹的只读展示、PWA 和原创 Logo。

这是**图鉴体验版**。默认显示 10 条固定的示例记录，右上角可切换空白收藏。示例不会写入 Supabase；浏览器只保存预览模式偏好，不保存 PIN、奖励、真实收藏。家长、兑换与进化执行入口明确说明下一阶段开放，不生成虚假的可用奖励码。

## 模块边界

- `src/data/pokemon.json`：151 个默认形态，简繁英名称、现行属性、六维种族值、简介、父级进化关系、历史属性、图片路径。
- `src/data/chapters.json`：6 个故事章节，30 只基础捕捉宝可梦。进化、传说、探索池互斥。
- `src/data/provenance.json`：导入时间与来源。
- `src/data/demo.ts`：只读示例与空白状态，Repository 接口的示例实现。
- `src/domain/`：纯函数，不依赖 React、浏览器或网络。未来服务端可复用规则说明，但正式兑换必须在 PostgreSQL 事务里执行。
- `src/components/collection-provider.tsx`：将当前快照提供给页面。第二阶段替换为受验证会话的服务端快照。
- `src/lib/supabase/`：服务端客户端工厂与纯配置校验。客户端按需创建，不共享用户会话；当前图鉴页面尚未调用，不会读取或写入家庭数据。独立连接检查命令只请求服务元数据。
- `public/pokemon/`：本地宝可梦插画。首次正常访问下载实际需要的图像，离线缓存只保留看过的静态资源。

## 收藏规则

`collectionState()` 输出 locked / available / collected / evolvable。只有收集过的宝可梦显示名称、属性和详情。未收集的路由不会在网页标题、替代文本或进化链里透露名称。静态 JSON 是公开知识数据，隐藏属于发现体验，不是数据保密机制。

故事章节按当前未收集的捕捉池推进，进化不阻塞章节。完成故事后才进入自由探索。进化产生一个新条目，保留原有条目，伊布对应 134、135、136 三个独立选择。皮卡丘等在后代拥有幼年形态的宝可梦在本项目仍作为关都基础形态。

传说：144 / 145 / 146 分别要求 60 / 80 / 100；150 要求故事结束并达到 140；151 要求已收集其他 150，只开放最终相遇，不消耗传说券。普通捕捉池始终排除传说和进化形态。

## 第二阶段：Supabase、家庭身份与真实奖励

需要在开始真实家庭使用前完成：

所有 Supabase 配置仅用于服务端：`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`，均禁止 `NEXT_PUBLIC_` 前缀。服务端客户端模块使用 `import 'server-only'`，浏览器通过经过身份验证的 Next.js Route Handlers / Server Actions 访问业务功能，不直接调用 Supabase，也不接收这些配置值。

1. 家庭入驻与 Supabase Auth 家长身份。孩子设备用配对后的受限身份，只能读取自己的收藏和兑换本家庭奖励。隐藏家长链接不能代替权限校验。
2. PIN 只保留服务端强哈希；PIN 校验失败计数、速率限制、HttpOnly + Secure + SameSite 会话，服务端检查所有家长操作。PIN 作为家长区域的二次解锁，不代替家庭身份。
3. RLS 隔离 families / children / pokemon_collection / reward_codes / inventory / story_progress / legendary_progress。孩子无法直接 INSERT 收藏或 UPDATE 奖励。
4. 6 位码保留前导零，按家庭范围保证活动码唯一，设置有效期，服务端限速。家长创建捕捉码时不选宝可梦。
5. `redeem_reward(code)` RPC 验证 auth.uid() 与家庭，按固定顺序锁定孩子状态和奖励码，读取库存/收藏/章节，计算候选池，再在事务中选取、插入、推进章节、标记已兑换并保存结果。对 `(child_id, pokemon_id)` 建唯一约束。候选池为空时不消耗奖励。
6. 并发兑换同一码和不同码都必须串行化到孩子维度；重试返回已持久化结果，不能再次抽取。RPC 要固定 search_path、限制 EXECUTE 授权并测试跨家庭权限。
7. `evolve_pokemon(target_id)` RPC 同一事务中验证前置形态和库存、去重、扣券、插入新形态并继承票据的成长理由。传说券也需保留来源理由；梦幻自动开放但仍由原子 RPC 完成收藏。
8. 只有 RPC 提交成功后才播放可跳过、尊重 reduced-motion 的捕捉/进化动画。刷新恢复相同结果。默认静音，音效另行显式开启。

本版不附未完成的 SQL，也无需执行 SQL。完整 RLS、身份设计和原子 RPC 应作为同一套迁移交付并一起验证，避免把安全尚未完成的数据库用于家庭数据。
