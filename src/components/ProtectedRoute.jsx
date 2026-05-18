import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true)
      else navigate('/admin')
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{padding:40,textAlign:'center'}}>טוען...</div>
  return authed ? children : null
}
