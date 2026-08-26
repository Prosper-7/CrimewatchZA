// src/pages/ModerationDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// NOTE: fixed to query the "incidents" table (not "reports") and to use the
// actual status values from supabase/schema.sql: reported / verified /
// resolved / false_report — the originals ("pending" / "dismissed") don't
// exist in the database and would silently return zero rows.
const FILTERS = ['reported', 'verified', 'resolved', 'false_report', 'all']

export default function ModerationDashboard() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('reported')

  useEffect(() => {
    let query = supabase.from('incidents').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)

    query.then(({ data, error }) => {
      if (!error) setReports(data)
    })
  }, [filter])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('incidents').update({ status }).eq('id', id)
    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    }
  }

  return (
    <div style={{ padding: 24, color: '#e8ebf2' }}>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
        Moderation queue
      </h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reports.map((r) => (
          <li key={r.id} style={{ borderBottom: '1px solid #2a3550', padding: '12px 0' }}>
            <strong>{r.title}</strong> — {r.category} — {r.severity}
            <p>{r.description}</p>
            <span>Status: {r.status}</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => updateStatus(r.id, 'verified')}>Verify</button>
              <button onClick={() => updateStatus(r.id, 'resolved')}>Resolve</button>
              <button onClick={() => updateStatus(r.id, 'false_report')}>Dismiss</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
