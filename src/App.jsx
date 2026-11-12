import React, { useCallback, useEffect, useState } from 'react'

const PRIORITY_OPTIONS = ['高', '中', '低']
const FILTERS = ['全部', '高', '中', '低']

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok || payload.ok === false) {
    throw new Error(payload.error || `请求失败（HTTP ${res.status}）`)
  }
  return payload.data
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('中')
  const [filter, setFilter] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = filter === '全部' ? '' : `?priority=${encodeURIComponent(filter)}`
      const list = await request(`/api/tasks${query}`)
      setTasks(list)
      setError('')
    } catch (err) {
      setError(err.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(event) {
    event.preventDefault()
    const value = title.trim()
    if (!value) {
      setError('请先输入任务标题')
      return
    }
    setSubmitting(true)
    try {
      await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: value, priority }),
      })
      setTitle('')
      setError('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
    event.target.reset?.()
  }

  async function toggleTask(task) {
    setBusyId(task.id)
    try {
      await request('/api/tasks', {
        method: 'PATCH',
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      })
      setError('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function removeTask(task) {
    setBusyId(task.id)
    try {
      await request(`/api/tasks?id=${task.id}`, { method: 'DELETE' })
      setError('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const total = tasks.length
  const done = tasks.filter((t) => t.completed).length

  return (
    <div className="page">
      <header className="header">
        <h1>智能任务管理系统</h1>
        <p className="subtitle">输入任务、选好优先级，一键入库到 Supabase 云端数据库</p>
      </header>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          className="title-input"
          type="text"
          value={title}
          maxLength={200}
          placeholder="今天要做什么？"
          onChange={(e) => setTitle(e.target.value)}
        />
        <select className="priority-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITY_OPTIONS.map((item) => (
            <option key={item} value={item}>
              优先级 {item}
            </option>
          ))}
        </select>
        <button className="add-button" type="submit" disabled={submitting}>
          {submitting ? '添加中…' : '添加'}
        </button>
      </form>

      <div className="toolbar">
        <div className="filters">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-button${filter === item ? ' active' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="summary">
          共 {total} 条 · 已完成 {done} 条
        </span>
      </div>

      {error && (
        <div className="error-bar">
          <strong>出错了：</strong>
          <span>{error}</span>
        </div>
      )}

      <main className="task-list">
        {loading && <div className="empty">加载中…</div>}

        {!loading && tasks.length === 0 && (
          <div className="empty">
            还没有任务，先在上面的输入框加一条吧
          </div>
        )}

        {!loading &&
          tasks.map((task) => (
            <article key={task.id} className={`task-item${task.completed ? ' completed' : ''}`}>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              <div className="task-main">
                <p className="task-title">{task.title}</p>
                <p className="task-meta">
                  {formatTime(task.created_at)} · {task.completed ? '已完成' : '未完成'}
                </p>
              </div>
              <div className="task-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busyId === task.id}
                  onClick={() => toggleTask(task)}
                >
                  {task.completed ? '标记未完成' : '标记完成'}
                </button>
                <button
                  type="button"
                  className="btn danger"
                  disabled={busyId === task.id}
                  onClick={() => removeTask(task)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
      </main>

      <footer className="footer">数据存储在 Supabase（PostgreSQL），关闭浏览器再打开依然存在。</footer>
    </div>
  )
}
