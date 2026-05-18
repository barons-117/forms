import { useLocation, useParams, useNavigate } from 'react-router-dom'

export default function ThankYou() {
  const { state } = useLocation()
  const { slug } = useParams()
  const navigate = useNavigate()
  const message = state?.message || 'תודה! פנייתך התקבלה.'

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f5f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 48,
        width: '100%', maxWidth: 480, textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', direction: 'rtl'
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
          {message}
        </h1>
        <p style={{ color: '#888', fontSize: 15, marginBottom: 32 }}>
          נחזור אליך בהקדם.
        </p>
        <button
          onClick={() => navigate(`/${slug}`)}
          style={{
            padding: '10px 28px', background: '#1a1a2e', color: 'white',
            border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer'
          }}
        >
          חזרה לטופס
        </button>
      </div>
    </div>
  )
}
