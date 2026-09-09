# 数据库初始化

在 Supabase SQL Editor 中完整执行一次 `migrations/202609080001_family_rewards.sql`。首次迁移在一个事务中创建 `kanto_` 前缀的表、权限与函数，不插入家庭或示例收藏。然后执行 `migrations/202609080002_chapter_discoveries.sql`，支持持久化章节解锁事件。已初始化的家庭只需执行 `002`。成功后不要重复运行。

家庭通过部署后 `/setup` 页面创建，要求家长提供环境变量 `APP_SETUP_TOKEN` 中的口令。PIN 使用服务端 scrypt 哈希；数据库不保存明文 PIN 或设备连接凭据。

部署步骤、五项环境变量和验收流程见 [`../docs/deployment.md`](../docs/deployment.md)。

本地 `npm test` 使用 PGlite 执行迁移与奖励规则，不读写云端数据库。`npm run sql:check` 检查 SQL 编号规则和仓库 JSON 一致。已有数据库的升级需增加新版本迁移，不要修改或重复执行已经上线的初始化脚本。
