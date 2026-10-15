// Repo path: src/pages/ModerationDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// CHANGE THIS to the real Storage bucket name (Supabase -> Storage)
const MEDIA_BUCKET = 'incident-media'

// media_urls may hold full URLs or storage paths, as strings or {url} objects. Handle all.
function resolveUrl(item) {
  const path = typeof item === 'string' ? item : item?.url
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  // If the bucket is PRIVATE, swap this for createSignedUrl (see notes)
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

const isVideo = (url) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url)

function MediaGallery({ mediaUrls }) {
  const [enlarged, setEnlarged] = useState(null)

  const items = (Array.isArray(mediaUrls) ? mediaUrls : [])
    .map(resolveUrl)
    .filter(Boolean)

  if (items.length === 0) {
    return <p style={{ fontStyle: 'italic', opacity: 0.7 }}>No photo/video evidence attached.</p>
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
        {items.map((url) =>
          isVideo(url) ? (
            <video
              key={url}
              src={url}
              controls
              preload="metadata"
              style={{ width: 220, maxWidth: '100%', borderRadius: 6 }}
            />
          ) : (
            <img
              key={url}
              src={url}
              alt="Incident evidence"
              loading="lazy"
              onClick={() => setEnlarged(url)}
              style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, cursor: 'zoom-in' }}
            />
          )
        )}
      </div>

      {enlarged && (
        <div
          onClick={() => setEnlarged(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out',
          }}
        >
          <img src={enlarged} alt="Enlarged evidence" style={{ maxWidth: '92%', maxHeight: '92%' }} />
        </div>
      )}
    </>
  )
}

export default function ModerationDashboard() {
  const [incidents, setIncidents] = useState([])
  const [filter, setFilter] = useState('pending')
  const [error, setError] = useState(null)

  useEffect(() => {
    let query = supabase.from('incidents').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else {
        setError(null)
        setIncidents(data)
      }
    })
  }, [filter])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('incidents').update({ status }).eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    // Drop it from the current filtered view, or update in place when viewing "all"
    setIncidents((prev) =>
      filter === 'all'
        ? prev.map((i) => (i.id === id ? { ...i, status } : i))
        : prev.filter((i) => i.id !== id)
    )
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

      {error && <p role="alert">{error}</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {incidents.map((i) => (
          <li key={i.id} style={{ borderBottom: '1px solid #444', padding: '12px 0' }}>
            <strong>{i.title}</strong> — {i.category} — {i.severity}
            <p>{i.description}</p>

            <MediaGallery mediaUrls={i.media_urls} />

            <span>Status: {i.status}</span>
            <div>
              <button onClick={() => updateStatus(i.id, 'verified')}>Verify</button>
              <button onClick={() => updateStatus(i.id, 'dismissed')}>Dismiss</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}