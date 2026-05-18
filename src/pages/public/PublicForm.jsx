import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function PublicForm() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(null)
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { loadForm() }, [slug])
  useEffect(() => { if (form?.pixel_id) injectPixel(form.pixel_id) }, [form])

  // Inject placeholder CSS for each field
  useEffect(() => {
    if (!form?.fields) return
    const styleId = 'form-placeholder-styles'
    const existing = document.getElementById(styleId)
    if (existing) existing.remove()

    const css = form.fields.map(f => {
      const align = f.placeholderAlign || (f.direction === 'ltr' ? 'left' : 'right')
      return `#field-${f.id}::placeholder { text-align: ${align}; }`
    }).join('\n')

    const style = document.createElement('style')
    style.id = styleId
    style.innerHTML = css
    document.head.appendChild(style)

    return () => { document.getElementById(styleId)?.remove() }
  }, [form])

  async function loadForm() {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()

    if (!data) { setNotFound(true); setLoading(false); return }
    setForm(data)
    const initial = {}
    data.fields.forEach(f => { initial[f.id] = f.type === 'checkbox' ? false : '' })
    setValues(initial)
    setLoading(false)
  }

  function injectPixel(pixelId) {
    if (window.fbq) return
    const script = document.createElement('script')
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `
    document.head.appendChild(script)
  }

  function validate() {
    const errs = {}
    form.fields.forEach(f => {
      if (f.required && !values[f.id] && values[f.id] !== true) errs[f.id] = 'שדה חובה'
      if (f.type === 'email' && values[f.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[f.id])) errs[f.id] = 'כתובת מייל לא תקינה'
      if (f.type === 'phone' && values[f.id] && !/^[0-9+\-\s]{7,15}$/.test(values[f.id])) errs[f.id] = 'מספר טלפון לא תקין'
    })
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)

    await supabase.from('submissions').insert({ form_id: form.id, data: values })

    if (window.fbq) window.fbq('track', 'Lead')

    if (form.email_recipients?.length > 0) {
      try {
        await supabase.functions.invoke('send-form-email', { body: { form, values } })
      } catch (e) { console.warn('Email send failed:', e) }
    }

    setSubmitting(false)

    if (form.thank_you_redirect) {
      window.location.href = form.thank_you_redirect
    } else {
      navigate(`/${slug}/thank-you`, { state: { message: form.thank_you_message } })
    }
  }

  function renderField(field) {
    const err = errors[field.id]
    const dir = field.direction || 'rtl'
    const textAlign = dir === 'ltr' ? 'left' : 'right'

    const commonStyle = {
      ...inputStyle,
      direction: dir,
      textAlign,
      borderColor: err ? '#dc3545' : '#ddd',
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={`field-${field.id}`}
            style={{ ...commonStyle, height: 100, resize: 'vertical' }}
            value={values[field.id] || ''}
            placeholder={field.placeholder || ''}
            onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
          />
        )

      case 'select': {
        const opts = (field.options || '').split(',').map(o => o.trim()).filter(Boolean)
        return (
          <select
            id={`field-${field.id}`}
            style={commonStyle}
            value={values[field.id] || ''}
            onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
          >
            <option value="">בחר...</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )
      }

      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!values[field.id]}
              onChange={e => setValues(v => ({ ...v, [field.id]: e.target.checked }))}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14, color: '#333' }}>{field.label}</span>
          </label>
        )

      default:
        return (
          <input
            id={`field-${field.id}`}
            type={field.type}
            style={commonStyle}
            value={values[field.id] || ''}
            placeholder={field.placeholder || ''}
            onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
          />
        )
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888' }}>טוען...</p>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ color: '#333' }}>הדף לא נמצא</h2>
      <p style={{ color: '#888' }}>הטופס לא קיים או אינו פעיל.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 520,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', direction: 'rtl'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 8, textAlign: 'center' }}>
          {form.name}
        </h1>
        <div style={{ width: 40, height: 3, background: '#e8c547', margin: '0 auto 28px', borderRadius: 2 }} />

        <form onSubmit={handleSubmit}>
          {form.fields.map(field => (
            <div key={field.id} style={{ marginBottom: 18 }}>
              {field.type !== 'checkbox' && (
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
                  {field.label} {field.required && <span style={{ color: '#dc3545' }}>*</span>}
                </label>
              )}
              {renderField(field)}
              {errors[field.id] && (
                <p style={{ color: '#dc3545', fontSize: 12, margin: '4px 0 0' }}>{errors[field.id]}</p>
              )}
            </div>
          ))}

          <button type="submit" disabled={submitting} style={btnSubmit}>
            {submitting ? 'שולח...' : 'שליחה'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box',
  outline: 'none',
}
const btnSubmit = {
  width: '100%', padding: '13px', background: '#1a1a2e',
  color: 'white', border: 'none', borderRadius: 8,
  fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8,
}
