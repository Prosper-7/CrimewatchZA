// src/pages/ArticleList.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'

export default function ArticleList() {
  const [articles, setArticles] = useState([])

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, slug, cover_image_url, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setArticles(data || []))
  }, [])

  return (
    <ul>
      {articles.map((a) => (
        <li key={a.id}>
          <Link to={`/articles/${a.slug}`}>{a.title}</Link>
        </li>
      ))}
    </ul>
  )
}

