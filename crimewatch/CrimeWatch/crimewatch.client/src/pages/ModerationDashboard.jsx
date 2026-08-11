// src/pages/ModerationDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ModerationDashboard() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)

    query.then(({ data, error }) => {
      if (!error) setReports(data)
    })
  }, [filter])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    }
  }

  return (
    <div>
      <h1>Moderation queue</h1>
      <div>
        {['pending', 'verified', 'dismissed', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}>
            {f}
          </button>
        ))}
      </div>
      <ul>
        {reports.map((r) => (
          <li key={r.id}>
            <strong>{r.title}</strong> — {r.category} — {r.severity}
            <p>{r.description}</p>
            <span>Status: {r.status}</span>
            <div>
              <button onClick={() => updateStatus(r.id, 'verified')}>Verify</button>
              <button onClick={() => updateStatus(r.id, 'dismissed')}>Dismiss</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
