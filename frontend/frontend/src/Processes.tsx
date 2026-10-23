import { useEffect, useState } from 'react'

type ProcessRow = {
  pid: number
  name: string
  cpu_percent: number
  memory_mb: number
  status: string
  username: string | null
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))
const cpuColor = (n: number) => (n > 70 ? 'var(--danger)' : n > 30 ? 'var(--warn)' : 'var(--accent-2)')

export default function Processes() {
  const [rows, setRows] = useState<ProcessRow[]>([])
  const [sort, setSort] = useState('memory')
  const [query, setQuery] = useState('')
  const [paused, setPaused] = useState(false)
  const [updated, setUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (paused) return
    let alive = true

    const load = async () => {
      try {
        const response = await fetch(`/api/processes?sort=${sort}&limit=100`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data: ProcessRow[] = await response.json()
        if (alive) {
          setRows(data)
          setUpdated(new Date())
          setError(null)
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load processes')
      }
    }

    load()
    const id = setInterval(load, 2000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [sort, paused])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? rows.filter(r => r.name.toLowerCase().includes(q) || String(r.pid).includes(q))
    : rows
  const maxMem = Math.max(...filtered.map(r => r.memory_mb), 1)

  return (
    <section className="card">
      <div className="card-head">
        <h2>
          Processes <span className="count">{filtered.length} shown</span>
        </h2>
        <div className="toolbar">
          <span className="live">
            <span className={`dot ${paused ? 'paused' : ''}`} />
            {paused ? 'Paused' : updated ? `Live · ${updated.toLocaleTimeString()}` : 'Connecting…'}
          </span>
          <input
            type="text"
            placeholder="Search name or PID"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="memory">Sort: Memory</option>
            <option value="cpu">Sort: CPU</option>
            <option value="name">Sort: Name</option>
            <option value="pid">Sort: PID</option>
          </select>
          <button className="ghost" onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th className="num">PID</th>
              <th>Status</th>
              <th className="num">CPU</th>
              <th className="num">Memory</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.pid}>
                <td className="name" title={p.name}>{p.name}</td>
                <td className="num">{p.pid}</td>
                <td>
                  <span className={`pill ${p.status === 'running' ? 'running' : ''}`}>{p.status}</span>
                </td>
                <td className="num">
                  <div className="meter">
                    <div className="bar">
                      <div
                        className="fill"
                        style={{ width: `${clamp(p.cpu_percent)}%`, background: cpuColor(p.cpu_percent) }}
                      />
                    </div>
                    <span className="val">{p.cpu_percent.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="num">
                  <div className="meter">
                    <div className="bar">
                      <div
                        className="fill"
                        style={{ width: `${(p.memory_mb / maxMem) * 100}%`, background: 'var(--accent)' }}
                      />
                    </div>
                    <span className="val">{p.memory_mb.toFixed(1)} MB</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}