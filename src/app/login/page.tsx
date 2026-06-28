'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const sb = createClient()
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'parent' ? '/parent' : '/student')
    router.refresh()
  }

  const s: Record<string, React.CSSProperties> = {
    page:  { minHeight:'100vh', background:'#0A0F1E', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' },
    card:  { width:400, background:'#0F1629', border:'1px solid #1E2A47', borderRadius:16, padding:40 },
    label: { display:'block', fontSize:12, color:'#94A3B8', marginBottom:6 },
    input: { width:'100%', padding:'10px 14px', background:'#141B33', border:'1px solid #1E2A47', borderRadius:8, color:'#F8FAFC', fontSize:14, outline:'none', boxSizing:'border-box' as const },
    btn:   { width:'100%', padding:12, background:'#6C63FF', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' },
    err:   { padding:'10px 14px', background:'#EF444415', border:'1px solid #EF444430', borderRadius:8, fontSize:13, color:'#EF4444', marginBottom:16 },
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#6C63FF', letterSpacing:'0.05em', fontFamily:'"Space Grotesk",sans-serif' }}>AI ENGINEER&apos;S JOURNEY</div>
          <div style={{ fontSize:24, fontWeight:700, color:'#F8FAFC', marginTop:6 }}>Sign in</div>
          <div style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>Rishona or Tushar — same page, different dashboard</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:16 }}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <div style={s.err}>{error}</div>}
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <div style={{ marginTop:20, padding:14, background:'#141B33', borderRadius:8, fontSize:12, color:'#94A3B8' }}>
          🎓 Students land on their dashboard · 👨‍👩‍👧 Parents land on the oversight panel
        </div>
      </div>
    </div>
  )
}
