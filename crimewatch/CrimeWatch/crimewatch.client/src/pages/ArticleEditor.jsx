// src/pages/ArticleEditor.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ArticleEditor() {
  const { session } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  function slugify(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function saveDraft(publish = false) {
    setSaving(true)
    const { error } = await supabase.from('articles').insert({
      title,
      slug: slugify(title),
      body,
      published: publish,
      author_id: session.user.id,
    })
    setSaving(false)
    if (!error) {
      setTitle('')
      setBody('')
    }
  }

  return (
    <div>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Body (markdown ok)" value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
      <button disabled={saving} onClick={() => saveDraft(false)}>Save draft</button>
      <button disabled={saving} onClick={() => saveDraft(true)}>Publish</button>
    </div>
  )
}
