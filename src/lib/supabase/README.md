# Supabase 服务端接入

三项数据库环境变量：`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`，均为服务端变量，禁止 `NEXT_PUBLIC_` 前缀。家庭应用另需 `APP_SESSION_SECRET` 与 `APP_SETUP_TOKEN`。配置方式见项目 `docs/deployment.md`。

`server.ts` 使用 `import 'server-only'`：

- `createSupabaseAdminClient()` 为已验证设备、家长 PIN、初始化或配对请求处理业务。高权限 key 不能代替 Next.js 接口的身份与孩子范围校验。
- `createSupabaseServerClient(accessToken?)` 保留普通权限工厂。当前家庭配对模式不使用 Supabase Auth；无 token 时为匿名权限，对 Kanto 表与 RPC 无访问权限。

客户端只通过同源 `/api` 读取快照、创建或兑换奖励，不接收任何 Supabase 配置值。禁止从组件导入服务端客户端。每次请求独立创建客户端，关闭会话持久化与自动刷新。

数据库迁移位于 `supabase/migrations`；身份与请求校验在 `src/lib/server`，API 在 `src/app/api/[...path]/route.ts`。RLS 与角色权限拒绝浏览器直接访问，高权限 RPC 只由服务端调用。

`npm run check:env` 校验五项配置；`npm run check:supabase` 只联网读取 Auth / REST 元数据。两者不输出配置值。构建允许全部 Supabase 配置留空的示例模式；完整配置后启用真实家庭模式。公开产物扫描会检查五项实际值是否进入客户端脚本、HTML 或 RSC。
