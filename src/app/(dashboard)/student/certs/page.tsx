'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { bg:'#0A0F1E', navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981', red:'#EF4444' }

export default function CertsPage() {
  const [certs, setCerts]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState<'list'|'claim'>('list')
  const [active, setActive]     = useState<any>(null)
  const [certUrl, setCertUrl]   = useState('')
  const [file, setFile]         = useState<File|null>(null)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<string|null>(null)
  const [userId, setUserId]     = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sb = createClient()

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null), 2500) }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await sb.from('certificates').select('*').eq('student_id', user.id).order('display_order')
      setCerts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const openClaim = (cert: any) => {
    setCertUrl(cert.cert_url ?? '')
    setFile(null)
    setActive(cert)
    setView('claim')
  }

  const claimCert = async () => {
    if (!userId || !active) return
    setSaving(true)
    let fileUrl: string|null = certUrl || null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/certs/${active.id}-${Date.now()}.${ext}`
      const { data: up } = await sb.storage.from('ai-journey').upload(path, file, { upsert:true })
      if (up) {
        const { data: url } = sb.storage.from('ai-journey').getPublicUrl(up.path)
        fileUrl = url.publicUrl
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const { data } = await sb.from('certificates')
      .update({ earned: true, earned_date: today, cert_url: fileUrl })
      .eq('id', active.id)
      .select().single()

    if (data) setCerts(prev => prev.map(c => c.id === active.id ? data : c))
    setSaving(false)
    showToast('🏅 Certificate claimed!')
    setView('list')
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:T.slate, fontFamily:'Inter,sans-serif' }}>Loading…</div>

  const earned = certs.filter(c => c.earned).length
  const byYear: Record<number,any[]> = {}
  for (const c of certs) {
    if (!byYear[c.year_target]) byYear[c.year_target] = []
    byYear[c.year_target].push(c)
  }
  const yearLabels: Record<number,string> = { 1:'Year 1 · Foundation', 2:'Year 2 · Depth', 3:'Year 3 · Frontier', 4:'Year 4 · Legacy' }

  // ── CLAIM VIEW ───────────────────────────────────────────────────────────
  if (view === 'claim' && active) return (
    <div style={{ fontFamily:'Inter,sans-serif', minHeight:'100vh', background:T.bg, padding:'16px 16px 24px' }}>
      <button onClick={() => setView('list')} style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← Back</button>

      <div style={{ fontSize:18, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', marginBottom:4 }}>
        🏅 Claim Certificate
      </div>
      <div style={{ fontSize:14, color:T.slate, marginBottom:6 }}>{active.name}</div>
      <div style={{ fontSize:12, color:T.indigo, marginBottom:24 }}>{active.provider}</div>

      {/* Upload file */}
      <div style={{ background:T.navy2, border:`2px dashed ${file ? T.amber : T.border}`, borderRadius:14, padding:24, marginBottom:12, textAlign:'center', cursor:'pointer' }}
        onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display:'none' }}
          onChange={e => setFile(e.target.files?.[0]??null)} />
        {file ? (
          <div>
            <div style={{ fontSize:32, marginBottom:8 }}>📜</div>
            <div style={{ fontSize:13, color:T.amber, fontWeight:600 }}>{file.name}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:3 }}>{(file.size/1024/1024).toFixed(2)} MB</div>
            <button onClick={e=>{e.stopPropagation();setFile(null)}} style={{ marginTop:8, fontSize:11, color:T.red, background:'none', border:'none', cursor:'pointer' }}>Remove</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:40, marginBottom:10 }}>📸</div>
            <div style={{ fontSize:15, color:T.white, fontWeight:600, marginBottom:4 }}>Upload your certificate</div>
            <div style={{ fontSize:13, color:T.slate }}>Screenshot or PDF of the actual certificate</div>
            <div style={{ marginTop:8, fontSize:12, color:T.amber }}>Tap to choose file</div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{ flex:1, height:1, background:T.border }} />
        <span style={{ fontSize:11, color:T.slate }}>or paste the link</span>
        <div style={{ flex:1, height:1, background:T.border }} />
      </div>

      <div style={{ marginBottom:24 }}>
        <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>Certificate URL (Coursera, edX, LinkedIn, etc.)</label>
        <input value={certUrl} onChange={e => setCertUrl(e.target.value)}
          placeholder="https://coursera.org/verify/..."
          style={{ width:'100%', padding:'12px 14px', background:T.navy2, border:`1px solid ${certUrl ? T.amber : T.border}`, borderRadius:10, color:T.white, fontSize:14, boxSizing:'border-box' }} />
      </div>

      <button onClick={claimCert} disabled={saving || (!file && !certUrl)}
        style={{ width:'100%', padding:15, background: (!file && !certUrl) ? T.navy3 : T.amber, border:'none', borderRadius:12,
          color: (!file && !certUrl) ? T.slate : '#000', fontSize:15, fontWeight:700, cursor: (!file && !certUrl) ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving…' : '🏅 Claim Certificate'}
      </button>
      <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:T.slate }}>
        Upload the file or paste a link — at least one is required
      </div>
    </div>
  )

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      {toast && <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:200, background:T.amber, color:'#000', padding:'10px 20px', borderRadius:30, fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>{toast}</div>}

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>Certificates</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{earned} earned · {certs.length - earned} to go</div>
      </div>

      {/* Overall progress */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Overall</span>
          <span style={{ fontSize:13, fontWeight:700, color:T.amber }}>{earned} / {certs.length}</span>
        </div>
        <div style={{ height:8, background:T.navy3, borderRadius:4 }}>
          <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,${T.amber},#F5A623)`, width:`${certs.length ? Math.round((earned/certs.length)*100) : 0}%`, transition:'width 0.5s' }} />
        </div>
        <div style={{ marginTop:8, fontSize:11, color:T.slate }}>Tap any certificate to upload proof and mark it earned</div>
      </div>

      {[1,2,3].map(yr => {
        const yearCerts = byYear[yr] ?? []
        if (!yearCerts.length) return null
        const yEarned = yearCerts.filter(c=>c.earned).length
        const isCurrentYear = yr === 1
        return (
          <div key={yr} style={{ marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:12, fontWeight:700, color: isCurrentYear ? T.white : T.slate, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                {yearLabels[yr]}
              </span>
              <span style={{ fontSize:11, color:T.slate }}>{yEarned}/{yearCerts.length}</span>
            </div>
            {yearCerts.map((c:any) => (
              <div key={c.id} onClick={() => !c.earned ? openClaim(c) : c.cert_url ? window.open(c.cert_url,'_blank') : openClaim(c)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', marginBottom:10,
                  background: c.earned ? `${T.amber}12` : T.navy2,
                  border:`1px solid ${c.earned ? T.amber+'50' : T.border}`,
                  borderRadius:12, cursor:'pointer',
                  opacity: !c.earned && yr > 1 ? 0.5 : 1 }}>
                {/* Icon */}
                <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                  background: c.earned ? `${T.amber}25` : T.navy3,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {c.earned ? '🏅' : yr === 1 ? '🔓' : '🔒'}
                </div>
                {/* Info */}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color: c.earned ? T.white : T.slate }}>{c.name}</div>
                  <div style={{ fontSize:12, color:T.slate, marginTop:2 }}>{c.provider}</div>
                  {c.earned && c.earned_date && (
                    <div style={{ fontSize:11, color:T.amber, marginTop:3 }}>
                      Earned {new Date(c.earned_date).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  )}
                </div>
                {/* Right side */}
                {c.earned ? (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background:`${T.amber}25`, color:T.amber, fontWeight:700, marginBottom:4 }}>EARNED</div>
                    {c.cert_url && <div style={{ fontSize:10, color:T.indigo }}>View →</div>}
                  </div>
                ) : yr === 1 ? (
                  <div style={{ fontSize:11, color:T.indigo, fontWeight:600, whiteSpace:'nowrap' }}>Claim →</div>
                ) : null}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
