# Supabase 服务端接入

环境变量模板见 `.env.example`：`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`。三项均仅在服务端使用，禁止 `NEXT_PUBLIC_` 前缀。使用新版 `sb_publishable_...` 和 `sb_secret_...`，不使用旧 JWT service-role key。

`server.ts` 通过 `import 'server-only'` 阻止客户端组件导入：

- `createSupabaseServerClient(accessToken?)`：每次请求独立创建，用 publishable key 和可选的已验证用户令牌应用 RLS。无令牌时为匿名权限；函数本身不验证令牌，调用方必须验证身份。
- `createSupabaseAdminClient()`：使用 secret key 的高权限客户端。调用方必须先验证当前用户的操作权限，不能用它代替身份认证或家庭隔离。

两个工厂均禁用浏览器会话存储、自动刷新和 URL 会话检测。不共享带用户身份的全局客户端。浏览器只能通过经过身份验证的 Next.js Route Handlers / Server Actions 访问业务功能；不能通过 props、接口响应或 Next.js `env` 配置传出任何配置值。

当前图鉴页面尚未调用这两个工厂。真实家庭身份、RLS、奖励事务和 CollectionRepository 适配仍属于下一阶段，见 `docs/architecture.md`。

## 本地检查

```bash
npm run check:env
npm run check:supabase
```

按 Next.js 生产环境的优先级读取 `.env*` 和进程环境变量，只输出检查状态。连接检查只请求 Auth 配置和 REST 服务元数据，不查用户表、不写数据；遇到异常不打印服务响应或配置值。

`npm run build` 自动运行配置校验：完全未配置时允许构建示例图鉴，部分缺失、错误格式、旧变量或公开变量会失败。构建结束后检查公开产物是否包含 Supabase 配置值。
