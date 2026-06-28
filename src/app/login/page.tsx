'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const T = {
  bg:     '#0A0F1E',
  navy2:  '#0F1629',
  navy3:  '#141B33',
  border: '#1E2A47',
  indigo: '#6C63FF',
  indigoL:'#8B85FF',
  slate:  '#94A3B8',
  white:  '#F8FAFC',
  amber:  '#E8A838',
  emerald:'#10B981',
}

const USERS = [
  { name: 'Rishona', email: 'rishona.singla@aijengineers.in', emoji: '🎓', color: T.indigo,  role: 'student' },
  { name: 'Tushar',  email: 'tusharchd29@gmail.com',           emoji: '👨‍💻', color: T.amber,   role: 'parent'  },
]

export default function LoginPage() {
  const [selected, setSelected] = useState<number | null>(null)
  const [pin, setPin]           = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const user = selected !== null ? USERS[selected] : null

  const handleDigit = async (digit: string) => {
    if (loading) return
    const next = pin + digit
    setPin(next)
    setError(null)

    if (next.length === 4) {
      setLoading(true)
      const sb = createClient()
      // PIN is used as the password directly
      const { error: authError } = await sb.auth.signInWithPassword({
        email: user!.email,
        password: next,
      })
      if (authError) {
        setError('Wrong PIN — try again')
        setPin('')
        setLoading(false)
        return
      }
      router.push(user!.role === 'parent' ? '/parent' : '/student')
      router.refresh()
    }
  }

  const handleDelete = () => {
    setPin(p => p.slice(0, -1))
    setError(null)
  }

  const handleBack = () => {
    setSelected(null)
    setPin('')
    setError(null)
  }

  // ── Step 1: Pick a name ──────────────────────────────────────────────────
  if (selected === null) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo, letterSpacing: '0.08em', fontFamily: '"Space Grotesk",sans-serif', marginBottom: 8 }}>
              AI ENGINEER&apos;S JOURNEY
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.white, fontFamily: '"Space Grotesk",sans-serif' }}>
              Who&apos;s learning today?
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            {USERS.map((u, i) => (
              <button
                key={u.name}
                onClick={() => setSelected(i)}
                style={{
                  flex: 1,
                  padding: '28px 16px',
                  background: `${u.color}12`,
                  border: `1.5px solid ${u.color}40`,
                  borderRadius: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${u.color}22`
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${u.color}80`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${u.color}12`
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${u.color}40`
                }}
              >
                <div style={{ fontSize: 40, lineHeight: 1 }}>{u.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.white, fontFamily: '"Space Grotesk",sans-serif' }}>{u.name}</div>
                <div style={{ fontSize: 10, color: T.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {u.role === 'student' ? 'Student' : 'Mentor'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Enter PIN ────────────────────────────────────────────────────
  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length)

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, width: 320 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{user!.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.white, fontFamily: '"Space Grotesk",sans-serif' }}>
            Hi, {user!.name}
          </div>
          <div style={{ fontSize: 12, color: T.slate, marginTop: 4 }}>Enter your 4-digit PIN</div>
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
          {dots.map((filled, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: filled ? user!.color : 'transparent',
                border: `2px solid ${filled ? user!.color : T.border}`,
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#EF444415', border: '1px solid #EF444430', borderRadius: 8, fontSize: 13, color: '#EF4444', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={loading}
              style={numBtn(user!.color, loading)}
            >
              {d}
            </button>
          ))}
          {/* Bottom row: back arrow, 0, delete */}
          <button onClick={handleBack} disabled={loading} style={{ ...numBtn(T.slate, loading), fontSize: 16, color: T.slate }}>
            ←
          </button>
          <button onClick={() => handleDigit('0')} disabled={loading} style={numBtn(user!.color, loading)}>
            0
          </button>
          <button onClick={handleDelete} disabled={pin.length === 0 || loading} style={{ ...numBtn(T.slate, loading), fontSize: 16, color: T.slate }}>
            ⌫
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: T.slate }}>Signing in…</div>
        )}
      </div>
    </div>
  )
}

function numBtn(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: '16px 0',
    background: T.navy3,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    color: T.white,
    fontSize: 20,
    fontWeight: 600,
    fontFamily: '"Space Grotesk",sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.1s',
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: T.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter,sans-serif',
  },
  card: {
    width: 380,
    background: T.navy2,
    border: `1px solid ${T.border}`,
    borderRadius: 20,
    padding: 36,
  },
}
