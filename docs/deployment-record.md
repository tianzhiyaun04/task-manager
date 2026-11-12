# 练习二：智能任务管理系统 —— 部署与验收记录

> 记录时间：2026-11-12

## 一、成果地址

| 项目 | 地址 |
|---|---|
| GitHub 仓库 | https://github.com/tianzhiyaun04/task-manager |
| Vercel 生产环境 | https://task-manager-nine-rho-67.vercel.app |
| 自定义域名（待解析生效） | https://tianzhiyuan002.rangzijigenghao.online |
| Supabase 项目 | https://supabase.com/dashboard/project/qfreesveqfkveykwhrnb |

## 二、关键配置

### 1. Supabase
- 项目名 task-manager，区域 Singapore，ref `qfreesveqfkveykwhrnb`
- 表 `public.tasks`：id / title / priority(高·中·低) / completed / created_at
- RLS 已启用，4 条策略（anon 的 select、insert、update、delete）

### 2. Vercel 环境变量（Production）
| 变量名 | 值 |
|---|---|
| SUPABASE_URL | https://qfreesveqfkveykwhrnb.supabase.co |
| SUPABASE_ANON_KEY | sb_publishable_r_5VCcnpOO-iVCb5mh4y5A_pGemL-ML |
| NODE_ENV | production |
| CLIENT_BASE_PATH | / |

### 3. 部署方式
Git 已连接，但创建项目时未点 Deploy、push 未自动触发构建。最终用 Settings → Git → Deploy Hooks 创建 main 分支 Hook 触发生产部署。
该项目默认开启 Vercel Authentication（必须登录才能访问），已在 Settings → Deployment Protection 关闭。

## 三、域名绑定所需 DNS 记录

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | tianzhiyuan002 | 378150cc4d1a46db.vercel-dns-017.com. |
| TXT | _vercel | vc-domain-verify=tianzhiyuan002.rangzijigenghao.online,22f7784ae455f92efc62 |

添加后回 Vercel 域名页点 Refresh，状态变 Valid Configuration 即生效。

## 四、验收结论

- 本地构建通过；Supabase 建表 + RLS + 4 条策略通过；切自建库后 13 项 CRUD 联调全部通过；代码已推送且不含 .env；Vercel 部署 Ready。
- 剩余人工自查：浏览器打开生产网址、线上新增任务在 Supabase 可见、关浏览器重开数据仍在；域名解析待 DNS 添加。
