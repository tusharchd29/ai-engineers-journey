'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default function CertsPage() {
  const [certs, setCerts]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string|null>(null)
  const [certUrl, setCertUrl]   = useState('')
  const [saving, setSaving]     = useState(false)
  const sb = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb.from('certificates').select('*').eq('student_id', user.id).order('display_order')
      setCerts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const claimCert = async () => {
    if (!claiming) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await sb.from('certificates')
      .update({ earned: true, earned_date: today, cert_url: certUrl || null })
      .eq('id', claiming)
      .select().single()
    if (data) setCerts(prev => prev.map(c => c.id === claiming ? data : c))
    setClaiming(null); setCertUrl(''); setSaving(false)
  }

  if (loading) return <div style={{ padding:32, color:T.slate, textAlign:'center' }}>Loading certificates…</div>

  const earned = certs.filter(c => c.earned).length
  const byYear: Record<number, typeof certs> = {}
  for (const c of certs) {
    if (!byYear[c.year_target]) byYear[c.year_target] = []
    byYear[c.year_target].push(c)
  }
  const yearLabels: Record<number, string> = { 1:'Year 1 · Foundation', 2:'Year 2 · Depth', 3:'Year 3 · Frontier', 4:'Year 4 · Legacy' }

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>Certificates</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{earned} earned · {certs.length - earned} remaining</div>
      </div>

      {/* Progress bar */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Overall</span>
          <span style={{ fontSize:13, fontWeight:700, color:T.amber }}>{earned} / {certs.length}</span>
        </div>
        <div style={{ height:8, background:T.navy3, borderRadius:4 }}>
          <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,${T.amber},#F5A623)`, width:`${certs.length ? Math.round((earned/certs.length)*100) : 0}%`, transition:'width 0.5s' }} />
        </div>
        <div style={{ marginTop:8, fontSize:11, color:T.slate }}>Tap any certificate to mark it as earned and add the link</div>
      </div>

      {/* Claim modal */}
      {claiming && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
          <div style={{ width:'100%', background:T.navy2, borderRadius:'20px 20px 0 0', padding:24 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.white, marginBottom:4 }}>🏅 Claim Certificate</div>
            <div style={{ fontSize:13, color:T.slate, marginBottom:16 }}>
              {certs.find(c => c.id === claiming)?.name} · {certs.find(c => c.id === claiming)?.provider}
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>Certificate URL (optional)</label>
              <input
                value={certUrl}
                onChange={e => setCertUrl(e.target.value)}
                placeholder="Paste the link to your certificate…"
                style={{ width:'100%', padding:'10px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:10, color:T.white, fontSize:13, boxSizing:'border-box' }}
              />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setClaiming(null); setCertUrl('') }}
                style={{ flex:1, padding:12, background:'transparent', border:`1px solid ${T.border}`, borderRadius:10, color:T.slate, fontSize:14, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={claimCert} disabled={saving}
                style={{ flex:2, padding:12, background:T.amber, border:'none', borderRadius:10, color:'#000', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
                {saving ? 'Saving…' : '🏅 Mark Earned'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certs by year */}
      {Object.keys(byYear).map(yr => {
        const yearCerts = byYear[parseInt(yr)]
        const yEarned = yearCerts.filter(c => c.earned).length
        const isCurrentYear = parseInt(yr) === 1
        return (
          <div key={yr} style={{ marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color: isCurrentYear ? T.white : T.slate, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                {yearLabels[parseInt(yr)]}
              </div>
              <div style={{ fontSize:11, color:T.slate }}>{yEarned}/{yearCerts.length}</div>
            </div>
            {yearCerts.map(c => (
              <div key={c.id}
                onClick={() => !c.earned && setClaiming(c.id)}
                style={{
                  display:'flex', alignItems:'center', gap:14, padding:'14px 16px', marginBottom:10,
                  background: c.earned ? `${T.amber}12` : T.navy2,
                  border:`1px solid ${c.earned ? T.amber+'50' : T.border}`,
                  borderRadius:12, cursor: c.earned ? 'default' : 'pointer',
                  opacity: !c.earned && parseInt(yr) > 1 ? 0.55 : 1,
                }}
              >
                <div style={{ width:40, height:40, borderRadius:10, background: c.earned ? `${T.amber}25` : T.navy3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {c.earned ? '🏅' : '🔒'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color: c.earned ? T.white : T.slate }}>{c.name}</div>
                  <div style={{ fontSize:12, color:T.slate, marginTop:2 }}>{c.provider}</div>
                  {c.earned && c.earned_date && (
                    <div style={{ fontSize:11, color:T.amber, marginTop:3 }}>
                      Earned {new Date(c.earned_date).toLocaleDateString('en', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  )}
                  {c.cert_url && (
                    <a href={c.cert_url} target="_blank" rel="noreferrer"
                      style={{ fontSize:11, color:T.indigo, marginTop:2, display:'block' }}
                      onClick={e => e.stopPropagation()}>
                      View certificate →
                    </a>
                  )}
                </div>
                {c.earned
                  ? <div style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background:`${T.amber}25`, color:T.amber, fontWeight:700 }}>EARNED</div>
                  : parseInt(yr) === 1 && <div style={{ fontSize:10, color:T.slate }}>Tap to claim</div>
                }
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
