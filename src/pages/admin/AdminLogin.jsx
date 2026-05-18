import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('שם משתמש או סיסמא שגויים')
    else navigate('/admin/dashboard')
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5'}}>
      <div style={{background:'white',padding:40,borderRadius:12,width:340,boxShadow:'0 2px 20px rgba(0,0,0,0.1)'}}>
        <h2 style={{marginBottom:24,textAlign:'center'}}>כניסה לניהול</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="מייל" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="סיסמא" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          {error && <p style={{color:'red',fontSize:14}}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'נכנס...' : 'כניסה'}</button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {width:'100%',padding:'10px 12px',marginBottom:12,borderRadius:8,border:'1px solid #ddd',fontSize:15,boxSizing:'border-box',direction:'rtl'}
const btnStyle = {width:'100%',padding:'11px',background:'#1a1a2e',color:'white',border:'none',borderRadius:8,fontSize:15,cursor:'pointer',marginTop:4}
