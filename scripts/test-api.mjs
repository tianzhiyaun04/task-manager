// 联调脚本：按手册 5 步要求，实测 查询 / 添加 / 切换完成 / 删除
const BASE = process.env.APP_BASE || 'http://localhost:3000'

async function call(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

function report(name, ok, extra = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? '：' + extra : ''}`)
  return ok
}

const results = []

const list1 = await call('/api/tasks')
results.push(report('查询列表', list1.status === 200 && list1.body.ok, `当前 ${list1.body.data?.length ?? 0} 条`))

const created = []
for (const [title, priority] of [['完成实训报告', '高'], ['复习线性表链式存储', '中'], ['整理桌面文件', '低']]) {
  const r = await call('/api/tasks', { method: 'POST', body: JSON.stringify({ title, priority }) })
  const ok = r.status === 201 && r.body.ok
  results.push(report(`添加任务「${title}」(优先级 ${priority})`, ok, ok ? `id=${r.body.data.id}` : JSON.stringify(r.body)))
  if (ok) created.push(r.body.data)
}

const list2 = await call('/api/tasks')
const rows = list2.body.data || []
const desc = rows.length >= 2 ? rows[0].id > rows[1].id : true
results.push(report('按创建时间倒序', list2.status === 200 && desc, `共 ${rows.length} 条，首条 id=${rows[0]?.id}`))

for (const p of ['高', '中', '低']) {
  const r = await call(`/api/tasks?priority=${encodeURIComponent(p)}`)
  const allMatch = (r.body.data || []).every((t) => t.priority === p)
  results.push(report(`按优先级筛选「${p}」`, r.status === 200 && allMatch, `${(r.body.data || []).length} 条`))
}

const target = created[0]
const toggled = await call('/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: target.id, completed: true }) })
results.push(report('切换为已完成', toggled.status === 200 && toggled.body.data?.completed === true))
const back = await call('/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: target.id, completed: false }) })
results.push(report('切换为未完成', back.status === 200 && back.body.data?.completed === false))

const deleted = await call(`/api/tasks?id=${created[2].id}`, { method: 'DELETE' })
results.push(report('删除任务', deleted.status === 200 && deleted.body.ok))
const list3 = await call('/api/tasks')
const gone = !(list3.body.data || []).some((t) => t.id === created[2].id)
results.push(report('删除后列表不再包含该任务', gone))

const bad = await call('/api/tasks', { method: 'POST', body: JSON.stringify({ title: '', priority: '中' }) })
results.push(report('空标题被拒绝', bad.status === 400 && bad.body.ok === false, bad.body.error))

console.log(`\n通过 ${results.filter(Boolean).length}/${results.length} 项`)
process.exit(results.every(Boolean) ? 0 : 1)
