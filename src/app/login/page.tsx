'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const T = {
  bg:      '#FFF8F0',
  surface: '#FFFFFF',
  surface2:'#F5F0FF',
  border:  '#E8E0F0',
  purple:  '#7C6FE0',
  purpleL: '#A99EF0',
  muted:   '#8B82B8',
  text:    '#2D2352',
  peach:   '#F59E6C',
  mint:    '#5EC990',
}

const USERS = [
  { name: 'Rishona', email: 'rishona.singla@aijengineers.in', emoji: '🎓', color: T.purple,  role: 'student' },
  { name: 'Tushar',  email: 'tusharchd29@gmail.com',           emoji: '👨‍💻', color: T.peach,   role: 'parent'  },
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
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, letterSpacing: '0.1em', fontFamily: '"Space Grotesk",sans-serif', marginBottom: 8 }}>
            AI ENGINEER&apos;S JOURNEY
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: '"Space Grotesk",sans-serif' }}>
            Who&apos;s learning today?
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 360 }}>
          {USERS.map((u, i) => (
            <button
              key={u.name}
              onClick={() => setSelected(i)}
              style={{
                flex: 1,
                padding: '28px 16px',
                background: T.surface,
                border: `2px solid ${T.border}`,
                borderRadius: 20,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 2px 12px rgba(124,111,224,0.08)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = u.color
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${u.color}30`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = T.border
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(124,111,224,0.08)'
              }}
            >
              <div style={{ fontSize: 40, lineHeight: 1 }}>{u.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: '"Space Grotesk",sans-serif' }}>{u.name}</div>
              <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {u.role === 'student' ? 'Student' : 'Mentor'}
              </div>
            </button>
          ))}
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
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: '"Space Grotesk",sans-serif' }}>
            Hi, {user!.name}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Enter your 4-digit PIN</div>
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
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#F2717115', border: '1px solid #F2717130', borderRadius: 8, fontSize: 13, color: '#F27171', textAlign: 'center' }}>
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
          {/* Bottom row */}
          <button onClick={handleBack} disabled={loading} style={{ ...numBtn(T.muted, loading), fontSize: 16, color: T.muted }}>
            ←
          </button>
          <button onClick={() => handleDigit('0')} disabled={loading} style={numBtn(user!.color, loading)}>
            0
          </button>
          <button onClick={handleDelete} disabled={pin.length === 0 || loading} style={{ ...numBtn(T.muted, loading), fontSize: 16, color: T.muted }}>
            ⌫
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: T.muted }}>Signing in…</div>
        )}
      </div>
    </div>
  )
}

function numBtn(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: '16px 0',
    background: '#F5F0FF',
    border: `1px solid #E8E0F0`,
    borderRadius: 12,
    color: '#2D2352',
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
    background: '#FFF8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter,sans-serif',
    padding: 24,
  },
  card: {
    width: 380,
    background: '#FFFFFF',
    border: '1px solid #E8E0F0',
    borderRadius: 24,
    padding: 36,
    boxShadow: '0 4px 24px rgba(124,111,224,0.10)',
  },
}
