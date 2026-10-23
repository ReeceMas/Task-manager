import { useEffect, useState, type FormEvent } from 'react'
import Processes from './Processes'

type Task = { id: number; title: string; done: boolean; created_at: string }
type Filter = 'all' | 'active' | 'done'

const api = (path: string, opts?: RequestInit) =>
  fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const r = await api('/tasks')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setTasks(await r.json())
      setError(null)
    } catch {
      setError('Failed to load tasks. Is the backend running?')
    }
  }

  useEffect(() => {
  }, [])

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await api('/tasks', { method: 'POST', body: JSON.stringify({ title: title.trim() }) })
    setTitle('')
    load()
  }

  const toggle = async (t: Task) => {
    await api(`/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify({ done: !t.done }) })
    load()
  }

  const remove = async (id: number) => {
    await api(`/tasks/${id}`, { method: 'DELETE' })
    load()
  }

  const visible = tasks.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done
  )
  const doneCount = tasks.filter(t => t.done).length

  return (
    <div className="app">
      <header className="header">
        <h1>Task Manager</h1>
        <p>FastAPI + React + Postgres</p>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>
            Tasks <span className="count">{doneCount}/{tasks.length} done</span>
          </h2>
          <div className="tabs">
            {(['all', 'active', 'done'] as Filter[]).map(f => (
              <button
                key={f}
                className={`tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <form className="add-form" onSubmit={add}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs doing?"
            maxLength={200}
          />
          <button className="primary">Add task</button>
        </form>

        {visible.length === 0 ? (
          <p className="empty">Nothing here yet.</p>
        ) : (
          <ul className="task-list">
            {visible.map(t => (
              <li key={t.id} className={`task ${t.done ? 'done' : ''}`}>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
                <span className="title">{t.title}</span>
                <button className="del" onClick={() => remove(t.id)} aria-label="Delete task">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Processes />
    </div>
  )
}