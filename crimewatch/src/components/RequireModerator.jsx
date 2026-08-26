// src/components/RequireModerator.jsx
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function RequireModerator({ children }) {
  const { profile, loading } = useAuth()

  if (loading) return <p>Loading…</p>
  if (!profile || !['moderator', 'admin'].includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return children
}
