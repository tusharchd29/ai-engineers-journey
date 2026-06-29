'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0',
  purple:'#7C6FE0', purpleL:'#A99EF0', text:'#2D2352', muted:'#8B82B8',
  peach:'#F59E6C', mint:'#5EC990', sky:'#64BFDF', red:'#F27171',
}
const YEAR_LABELS: Record<number,string> = { 1:'Year 1 · Foundation', 2:'Year 2 · Depth', 3:'Year 3 · Frontier', 4:'Year 4 · Legacy' }

interface Props { userId:string; initialCerts:any[] }

export default function CertsClient({ userId, initialCerts }: Props) {
  const [certs, setCerts]   = useState(initialCerts)
  const [view, setView]     = useState<'list'|'claim'>('list')
  const [active, setActive] = useState<any>(null)
  const [certUrl, setCertUrl] = useState('')
  const [file, setFile]     = useState<File|null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sb = createClient()
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(null),2500) }

  const openClaim = (cert:any) => { setCertUrl(cert.cert_url??''); setFile(null); setActive(cert); setView('claim') }

  const claimCert = async () => {
    if (!active) return
    if (!file && !certUrl.trim()) { showToast('Add a file or URL first'); return }
    setSaving(true)
    let fileUrl:string|null = certUrl||null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/certs/${active.id}-${Date.now()}.${ext}`
      const { data:up } = await sb.storage.from('ai-journey').upload(path, file, { upsert:true })
      if (up) { const { data:url } = sb.storage.from('ai-journey').getPublicUrl(up.path); fileUrl = url.publicUrl }
    }
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await sb.from('certificates')
      .update({ earned:true, earned_date:today, cert_url:fileUrl })
      .eq('id', active.id).select().single()
    if (error) { showToast('Error — try again'); setSaving(false); return }
    if (data) setCerts(p => p.map(c => c.id===active.id ? data : c))
    setSaving(false); showToast('🏅 Certificate claimed!'); setView('list')
  }

  const earned = certs.filter(c=>c.earned).length
  const byYear: Record<number,any[]> = {}
  for (const c of certs) { if (!byYear[c.year_target]) byYear[c.year_target]=[]; byYear[c.year_target].push(c) }

  if (view==='claim' && active) return (
    <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', padding:'16px 16px 32px' }}>
      {toast && <div style={{ position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',zIndex:200,background:T.mint,color:'#fff',padding:'10px 20px',borderRadius:30,fontSize:13,fontWeight:700,whiteSpace:'nowrap',pointerEvents:'none' }}>{toast}</div>}
      <button onClick={()=>setView('list')} style={{ background:'none',border:'none',color:T.muted,fontSize:14,cursor:'pointer',marginBottom:16 }}>← Back</button>
      <div style={{ fontSize:18,fontWeight:700,color:T.text,fontFamily:'"Space Grotesk",sans-serif',marginBottom:4 }}>🏅 Claim Certificate</div>
      <div style={{ fontSize:14,color:T.muted,marginBottom:4 }}>{active.name}</div>
      <div style={{ fontSize:12,color:T.purple,marginBottom:24 }}>{active.provider}</div>

      <div style={{ background:T.surface,border:`2px dashed ${file?T.mint:T.border}`,borderRadius:14,padding:24,marginBottom:12,textAlign:'center',cursor:'pointer',boxShadow:'0 1px 8px rgba(124,111,224,0.04)' }}
        onClick={()=>fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={e=>setFile(e.target.files?.[0]??null)} />
        {file ? (
          <div>
            <div style={{ fontSize:32,marginBottom:8 }}>📜</div>
            <div style={{ fontSize:13,color:T.mint,fontWeight:600 }}>{file.name}</div>
            <div style={{ fontSize:11,color:T.muted,marginTop:2 }}>{(file.size/1024/1024).toFixed(2)} MB</div>
            <button onClick={e=>{e.stopPropagation();setFile(null)}} style={{ marginTop:8,fontSize:11,color:T.red,background:'none',border:'none',cursor:'pointer' }}>Remove</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:40,marginBottom:10 }}>📸</div>
            <div style={{ fontSize:15,color:T.text,fontWeight:600,marginBottom:4 }}>Upload your certificate</div>
            <div style={{ fontSize:13,color:T.muted }}>Screenshot or PDF of the certificate</div>
            <div style={{ marginTop:8,fontSize:12,color:T.peach }}>Tap to choose from phone</div>
          </div>
        )}
      </div>

      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
        <div style={{ flex:1,height:1,background:T.border }} />
        <span style={{ fontSize:11,color:T.muted }}>or paste the link</span>
        <div style={{ flex:1,height:1,background:T.border }} />
      </div>

      <div style={{ marginBottom:24 }}>
        <label style={{ fontSize:11,color:T.muted,display:'block',marginBottom:6 }}>Certificate URL</label>
        <input value={certUrl} onChange={e=>setCertUrl(e.target.value)}
          placeholder="https://coursera.org/verify/..."
          style={{ width:'100%',padding:'12px 14px',background:T.surface,border:`1px solid ${certUrl?T.purple:T.border}`,borderRadius:10,color:T.text,fontSize:14,boxSizing:'border-box' }} />
      </div>

      <button onClick={claimCert} disabled={saving||(!file&&!certUrl.trim())}
        style={{ width:'100%',padding:15,background:(!file&&!certUrl.trim())?T.surface2:T.purple,border:'none',borderRadius:12,color:(!file&&!certUrl.trim())?T.muted:'#fff',fontSize:15,fontWeight:700,cursor:(!file&&!certUrl.trim())?'not-allowed':'pointer' }}>
        {saving?'Saving…':'🏅 Claim Certificate'}
      </button>
      <div style={{ textAlign:'center',marginTop:12,fontSize:12,color:T.muted }}>Upload a file OR paste a link — at least one required</div>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      {toast && <div style={{ position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',zIndex:200,background:T.mint,color:'#fff',padding:'10px 20px',borderRadius:30,fontSize:13,fontWeight:700,whiteSpace:'nowrap',pointerEvents:'none' }}>{toast}</div>}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22,fontWeight:700,fontFamily:'"Space Grotesk",sans-serif',color:T.text }}>Certificates</div>
        <div style={{ fontSize:13,color:T.muted,marginTop:4 }}>{earned} earned · {certs.length-earned} remaining</div>
      </div>
      <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'14px 16px',marginBottom:20,boxShadow:'0 1px 8px rgba(124,111,224,0.04)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
          <span style={{ fontSize:12,color:T.muted }}>Overall</span>
          <span style={{ fontSize:13,fontWeight:700,color:T.peach }}>{earned} / {certs.length}</span>
        </div>
        <div style={{ height:8,background:T.surface2,borderRadius:4 }}>
          <div style={{ height:'100%',borderRadius:4,background:`linear-gradient(90deg,${T.peach},${T.purple})`,width:`${certs.length?Math.round((earned/certs.length)*100):0}%`,transition:'width 0.5s' }} />
        </div>
        <div style={{ marginTop:8,fontSize:11,color:T.muted }}>Tap any Year 1 cert to upload proof and mark it earned</div>
      </div>
      {[1,2,3].map(yr => {
        const yc=byYear[yr]??[]; if(!yc.length) return null
        const ye=yc.filter((c:any)=>c.earned).length
        return (
          <div key={yr} style={{ marginBottom:24 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
              <span style={{ fontSize:12,fontWeight:700,color:yr===1?T.text:T.muted,textTransform:'uppercase',letterSpacing:'0.07em' }}>{YEAR_LABELS[yr]}</span>
              <span style={{ fontSize:11,color:T.muted }}>{ye}/{yc.length}</span>
            </div>
            {yc.map((c:any) => (
              <div key={c.id}
                onClick={()=>yr===1?openClaim(c):c.cert_url?window.open(c.cert_url,'_blank'):null}
                style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',marginBottom:10,
                  background:c.earned?'#EDFBF4':T.surface,
                  border:`1px solid ${c.earned?T.mint+'60':T.border}`,
                  borderRadius:12,cursor:yr===1||c.cert_url?'pointer':'default',opacity:!c.earned&&yr>1?0.5:1,
                  boxShadow: c.earned ? '0 1px 8px rgba(94,201,144,0.10)' : 'none' }}>
                <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,
                  background:c.earned?'#CCEDD9':T.surface2,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>
                  {c.earned?'🏅':yr===1?'🔓':'🔒'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:600,color:c.earned?T.text:T.muted }}>{c.name}</div>
                  <div style={{ fontSize:12,color:T.muted,marginTop:2 }}>{c.provider}</div>
                  {c.earned&&c.earned_date&&<div style={{ fontSize:11,color:T.mint,marginTop:3 }}>Earned {new Date(c.earned_date).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'})}</div>}
                </div>
                {c.earned?<div style={{ fontSize:10,padding:'3px 8px',borderRadius:20,background:'#CCEDD9',color:T.mint,fontWeight:700,flexShrink:0 }}>EARNED</div>
                  :yr===1?<div style={{ fontSize:11,color:T.purple,fontWeight:600,flexShrink:0 }}>Claim →</div>:null}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
