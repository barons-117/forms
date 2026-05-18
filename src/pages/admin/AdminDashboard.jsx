import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadForms() }, [])

  async function loadForms() {
    const { data } = await supabase.from('forms').select('*').order('created_at', { ascending: false })
    setForms(data || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin')
  }

  async function toggleActive(form) {
    await supabase.from('forms').update({ active: !form.active }).eq('id', form.id)
    loadForms()
  }

  async function deleteForm(id) {
    if (!confirm('למחוק את הטופס?')) return
    await supabase.from('forms').delete().eq('id', id)
    loadForms()
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f5',fontFamily:'sans-serif'}}>
      <div style={{background:'#1a1a2e',color:'white',padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0,fontSize:20}}>🗂 tofes.pro — ניהול טפסים</h1>
        <div style={{display:'flex',gap:12}}>
          <button onClick={() => navigate('/admin/forms/new')} style={btnPrimary}>+ טופס חדש</button>
          <button onClick={handleLogout} style={btnGhost}>יציאה</button>
        </div>
      </div>

      <div style={{padding:32,maxWidth:900,margin:'0 auto'}}>
        {loading ? <p>טוען...</p> : forms.length === 0 ? (
          <div style={{textAlign:'center',padding:60,color:'#888'}}>
            <p style={{fontSize:18}}>אין טפסים עדיין</p>
            <button onClick={() => navigate('/admin/forms/new')} style={btnPrimary}>צור טופס ראשון</button>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',background:'white',borderRadius:12,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.08)'}}>
            <thead>
              <tr style={{background:'#f0f0f0',textAlign:'right'}}>
                <th style={th}>שם הטופס</th>
                <th style={th}>כתובת URL</th>
                <th style={th}>סטטוס</th>
                <th style={th}>תאריך יצירה</th>
                <th style={th}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {forms.map(form => (
                <tr key={form.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={td}>{form.name}</td>
                  <td style={td}><a href={`/${form.slug}`} target="_blank" style={{color:'#1a1a2e'}}>tofes.pro/{form.slug}</a></td>
                  <td style={td}>
                    <span onClick={() => toggleActive(form)} style={{cursor:'pointer',padding:'3px 10px',borderRadius:20,fontSize:13,background:form.active?'#d4edda':'#f8d7da',color:form.active?'#155724':'#721c24'}}>
                      {form.active ? 'פעיל' : 'כבוי'}
                    </span>
                  </td>
                  <td style={td}>{new Date(form.created_at).toLocaleDateString('he-IL')}</td>
                  <td style={td}>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={() => navigate(`/admin/forms/${form.id}/submissions`)} style={btnSmall}>📋 תשובות</button>
                      <button onClick={() => navigate(`/admin/forms/${form.id}/edit`)} style={btnSmall}>✏️ עריכה</button>
                      <button onClick={() => deleteForm(form.id)} style={{...btnSmall,color:'#dc3545'}}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const th = {padding:'12px 16px',fontWeight:600,fontSize:14}
const td = {padding:'12px 16px',fontSize:14,direction:'rtl'}
const btnPrimary = {padding:'8px 18px',background:'#e8c547',color:'#1a1a2e',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:14}
const btnGhost = {padding:'8px 18px',background:'transparent',color:'white',border:'1px solid white',borderRadius:8,cursor:'pointer',fontSize:14}
const btnSmall = {padding:'5px 10px',background:'#f0f0f0',border:'none',borderRadius:6,cursor:'pointer',fontSize:13}
