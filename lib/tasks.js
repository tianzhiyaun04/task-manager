import { supabase } from './supabase.js'

const PRIORITIES = ['高', '中', '低']

function fail(res, status, error, detail) {
  res.status(status).json({ ok: false, error, detail: detail || null })
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body)
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  return raw ? JSON.parse(raw) : {}
}

function friendlyError(error) {
  const message = error?.message || String(error)
  if (/row-level security/i.test(message)) {
    return 'new row violates row-level security policy（RLS 策略没开全，回到手册 4.3 节重跑四条 create policy）'
  }
  if (/relation .*tasks.* does not exist/i.test(message)) {
    return 'relation "tasks" does not exist（表没建成功，回到手册 4.2 节重跑建表 SQL）'
  }
  return message
}

async function listTasks(filter) {
  let query = supabase
    .from('tasks')
    .select('id,title,priority,completed,created_at')
    .order('created_at', { ascending: false })

  if (filter && filter !== '全部') {
    query = query.eq('priority', filter)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const url = new URL(req.url, 'http://localhost')
  const method = (req.method || 'GET').toUpperCase()

  try {
    if (method === 'GET') {
      const priority = url.searchParams.get('priority')
      const data = await listTasks(priority)
      return res.status(200).json({ ok: true, data })
    }

    if (method === 'POST') {
      const body = await readBody(req)
      const title = String(body.title ?? '').trim()
      const priority = body.priority ?? '中'

      if (!title) return fail(res, 400, '任务标题不能为空')
      if (title.length > 200) return fail(res, 400, '任务标题过长（最多 200 字）')
      if (!PRIORITIES.includes(priority)) return fail(res, 400, '优先级只能是 高 / 中 / 低')

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ title, priority }])
        .select('id,title,priority,completed,created_at')
        .single()

      if (error) throw error
      return res.status(201).json({ ok: true, data })
    }

    if (method === 'PATCH') {
      const body = await readBody(req)
      const id = Number(body.id ?? url.searchParams.get('id'))
      if (!Number.isFinite(id)) return fail(res, 400, '缺少合法的任务 id')
      if (typeof body.completed !== 'boolean') return fail(res, 400, 'completed 必须是布尔值')

      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: body.completed })
        .eq('id', id)
        .select('id,title,priority,completed,created_at')
        .single()

      if (error) throw error
      return res.status(200).json({ ok: true, data })
    }

    if (method === 'DELETE') {
      const id = Number(url.searchParams.get('id') ?? (await readBody(req)).id)
      if (!Number.isFinite(id)) return fail(res, 400, '缺少合法的任务 id')

      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true, data: { id } })
    }

    return fail(res, 405, `不支持的请求方法：${method}`)
  } catch (error) {
    console.error('[tasks api]', error)
    return fail(res, 500, friendlyError(error), error?.details || error?.hint || null)
  }
}
