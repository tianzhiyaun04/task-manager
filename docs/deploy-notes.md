# 部署说明（练习二）

## Vercel 环境变量

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://qfreesveqfkveykwhrnb.supabase.co` |
| `SUPABASE_ANON_KEY` | `sb_publishable_...`（Supabase 控制台 API Keys 页面复制） |
| `NODE_ENV` | `production` |
| `CLIENT_BASE_PATH` | `/` |

> 变量名不要改，`SUPABASE_ANON_KEY` 这个名字在代码里是写死的。

## 验收清单

- [x] 本地预览能添加、完成、删除、筛选任务
- [x] Supabase Table Editor 能看到 tasks 表与数据
- [x] GitHub 仓库能看到完整代码
- [x] `.env` 未入库（已写入 `.gitignore`）
- [ ] Vercel 网址能正常打开
- [ ] 在 Vercel 网址添加任务后，Supabase 能看到新数据
- [ ] 关掉浏览器再打开 Vercel 网址，数据还在
