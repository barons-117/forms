import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const FIELD_TYPES = [
  { value: 'text', label: 'טקסט חופשי' },
  { value: 'email', label: 'מייל' },
  { value: 'phone', label: 'טלפון' },
  { value: 'number', label: 'מספר' },
  { value: 'select', label: 'בחירה מרשימה' },
  { value: 'checkbox', label: 'תיבת סימון' },
  { value: 'textarea', label: 'טקסט ארוך' },
]

const emptyField = () => ({
  id: crypto.randomUUID(),
  label: '',
  placeholder: '',
  type: 'text',
  required: false,
  options: '',
  direction: 'rtl',
  placeholderAlign: 'right',
})

export default function AdminFormEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [emailRecipients, setEmailRecipients] = useState('')
  const [pixelId, setPixelId] = useState('')
  const [thankYouMessage, setThankYouMessage] = useState('תודה! פנייתך התקבלה.')
  const [thankYouRedirect, setThankYouRedirect] = useState('')
  const [fields, setFields] = useState([emptyField()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) loadForm()
  }, [id])

  async function loadForm() {
    const { data } = await supabase.from('forms').select('*').eq('id', id).single()
    if (!data) return
    setName(data.name)
    setSlug(data.slug)
    setEmailRecipients((data.email_recipients || []).join(', '))
    setPixelId(data.pixel_id || '')
    setThankYouMessage(data.thank_you_message || '')
    setThankYouRedirect(data.thank_you_redirect || '')
    setFields(data.fields || [emptyField()])
  }

  function handleNameChange(val) {
    setName(val)
    if (!isEdit) setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  function updateField(index, key, value) {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f))
  }

  function addField() {
    setFields(prev => [...prev, emptyField()])
  }

  function removeField(index) {
    setFields(prev => prev.filter((_, i) => i !== index))
  }

  function moveField(index, dir) {
    setFields(prev => {
      const arr = [...prev]
      const target = index + dir
      if (target < 0 || target >= arr.length) return arr
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return arr
    })
  }

  async function handleSave() {
    if (!name || !slug) return setError('שם וכתובת URL הם שדות חובה')
    if (fields.some(f => !f.label)) return setError('כל השדות חייבים כותרת')
    setLoading(true)
    setError('')

    const payload = {
      name,
      slug,
      email_recipients: emailRecipients.split(',').map(e => e.trim()).filter(Boolean),
      pixel_id: pixelId || null,
      thank_you_message: thankYouMessage,
      thank_you_redirect: thankYouRedirect || null,
      fields,
    }

    const { error } = isEdit
      ? await supabase.from('forms').update(payload).eq('id', id)
      : await supabase.from('forms').insert(payload)

    if (error) setError(error.message)
    else navigate('/admin/dashboard')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ background: '#1a1a2e', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{isEdit ? '✏️ עריכת טופס' : '➕ טופס חדש'}</h1>
        <button onClick={() => navigate('/admin/dashboard')} style={btnGhost}>← חזרה</button>
      </div>

      <div style={{ padding: 32, maxWidth: 720, margin: '0 auto', direction: 'rtl' }}>

        {/* Basic Info */}
        <section style={card}>
          <h2 style={sectionTitle}>פרטי הטופס</h2>

          <label style={labelStyle}>שם הטופס</label>
          <input style={inputStyle} value={name} onChange={e => handleNameChange(e.target.value)} placeholder="למשל: הרשמה להרצאה בניו יורק" />

          <label style={labelStyle}>כתובת URL (slug)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ color: '#888', fontSize: 14, whiteSpace: 'nowrap' }}>tofes.pro/</span>
            <input style={{ ...inputStyle, marginBottom: 0, flex: 1, direction: 'ltr', textAlign: 'left' }} value={slug} onChange={e => setSlug(e.target.value)} placeholder="nyc-lecture" />
          </div>

          <label style={labelStyle}>נמענים למייל (מופרדים בפסיק)</label>
          <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} value={emailRecipients} onChange={e => setEmailRecipients(e.target.value)} placeholder="erez@example.com, info@example.com" />

          <label style={labelStyle}>Facebook Pixel ID (אופציונלי)</label>
          <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="123456789012345" />
        </section>

        {/* Fields */}
        <section style={card}>
          <h2 style={sectionTitle}>שדות הטופס</h2>

          {fields.map((field, index) => (
            <div key={field.id} style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 10, padding: 16, marginBottom: 12 }}>

              {/* Row 1: label + type */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  style={{ ...inputStyle, marginBottom: 0, flex: 2 }}
                  value={field.label}
                  onChange={e => updateField(index, 'label', e.target.value)}
                  placeholder="כותרת השדה (למשל: שם מלא)"
                />
                <select
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  value={field.type}
                  onChange={e => updateField(index, 'type', e.target.value)}
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Row 2: placeholder */}
              {field.type !== 'checkbox' && field.type !== 'select' && (
                <input
                  style={{ ...inputStyle, marginBottom: 10 }}
                  value={field.placeholder}
                  onChange={e => updateField(index, 'placeholder', e.target.value)}
                  placeholder="טקסט Placeholder (אופציונלי — ריק = ללא)"
                />
              )}

              {/* Row 3: options for select */}
              {field.type === 'select' && (
                <input
                  style={{ ...inputStyle, marginBottom: 10 }}
                  value={field.options}
                  onChange={e => updateField(index, 'options', e.target.value)}
                  placeholder="אפשרויות מופרדות בפסיק: תל אביב, ירושלים, חיפה"
                />
              )}

              {/* Row 4: direction + placeholder align + required + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

                <label style={miniLabel}>כיוון טקסט:</label>
                <select
                  style={selectSmall}
                  value={field.direction}
                  onChange={e => updateField(index, 'direction', e.target.value)}
                >
                  <option value="rtl">ימין (RTL)</option>
                  <option value="ltr">שמאל (LTR)</option>
                </select>

                {field.type !== 'checkbox' && field.type !== 'select' && (
                  <>
                    <label style={miniLabel}>Placeholder:</label>
                    <select
                      style={selectSmall}
                      value={field.placeholderAlign}
                      onChange={e => updateField(index, 'placeholderAlign', e.target.value)}
                    >
                      <option value="right">ימין</option>
                      <option value="left">שמאל</option>
                    </select>
                  </>
                )}

                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginRight: 'auto' }}>
                  <input type="checkbox" checked={field.required} onChange={e => updateField(index, 'required', e.target.checked)} />
                  חובה
                </label>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => moveField(index, -1)} style={btnTiny}>↑</button>
                  <button onClick={() => moveField(index, 1)} style={btnTiny}>↓</button>
                  <button onClick={() => removeField(index)} style={{ ...btnTiny, color: '#dc3545' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addField} style={{ ...btnSecondary, marginTop: 4 }}>+ הוסף שדה</button>
        </section>

        {/* Thank You */}
        <section style={card}>
          <h2 style={sectionTitle}>עמוד תודה</h2>

          <label style={labelStyle}>הודעת תודה</label>
          <textarea
            style={{ ...inputStyle, height: 80, resize: 'vertical' }}
            value={thankYouMessage}
            onChange={e => setThankYouMessage(e.target.value)}
          />

          <label style={labelStyle}>הפניה לכתובת חיצונית אחרי שליחה (אופציונלי)</label>
          <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} value={thankYouRedirect} onChange={e => setThankYouRedirect(e.target.value)} placeholder="https://example.com" />
        </section>

        {error && <p style={{ color: '#dc3545', marginBottom: 12 }}>{error}</p>}

        <button onClick={handleSave} disabled={loading} style={btnPrimary}>
          {loading ? 'שומר...' : isEdit ? 'שמור שינויים' : 'צור טופס'}
        </button>
      </div>
    </div>
  )
}

const card = { background: 'white', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
const sectionTitle = { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' }
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }
const miniLabel = { fontSize: 12, color: '#666', whiteSpace: 'nowrap' }
const inputStyle = { width: '100%', padding: '10px 12px', marginBottom: 16, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', direction: 'rtl' }
const selectSmall = { padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, direction: 'rtl' }
const btnPrimary = { padding: '12px 32px', background: '#e8c547', color: '#1a1a2e', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15, width: '100%' }
const btnSecondary = { padding: '9px 20px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }
const btnGhost = { padding: '8px 18px', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: 8, cursor: 'pointer', fontSize: 14 }
const btnTiny = { padding: '3px 8px', background: '#e0e0e0', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }
