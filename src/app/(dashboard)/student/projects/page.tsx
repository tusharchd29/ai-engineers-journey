'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { bg:'#0A0F1E', navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981', red:'#EF4444' }

const STATUS: Record<string,{label:string;color:string;emoji:string;bg:string}> = {
  not_started: { label:'Not started', color:T.slate,   emoji:'⭕', bg:T.navy2 },
  in_progress:  { label:'In progress', color:T.amber,   emoji:'🔨', bg:`${T.amber}10` },
  submitted:    { label:'Submitted',   color:T.indigo,  emoji:'📤', bg:`${T.indigo}10` },
  approved:     { label:'Approved',    color:T.emerald, emoji:'✅', bg:`${T.emerald}10` },
}
const DIFF: Record<string,{label:string;color:string}> = {
  beginner:     { label:'Beginner',     color:T.emerald },
  intermediate: { label:'Intermediate', color:T.amber   },
  advanced:     { label:'Advanced',     color:T.red     },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [subs, setSubs]         = useState<Record<string,any>>({})
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState<'list'|'detail'|'submit'>('list')
  const [active, setActive]     = useState<any>(null)
  const [form, setForm]         = useState({ github_url:'', live_url:'', notes:'' })
  const [file, setFile]         = useState<File|null>(null)
  const [saving, setSaving]     = useState(false)
  const [userId, setUserId]     = useState<string|null>(null)
  const [toast, setToast]       = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sb = createClient()

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null), 2500) }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [{ data: p }, { data: s }] = await Promise.all([
        sb.from('projects').select('*').order('display_order'),
        sb.from('project_submissions').select('*').eq('student_id', user.id),
      ])
      setProjects(p ?? [])
      const map: Record<string,any> = {}
      for (const sub of s ?? []) map[sub.project_id] = sub
      setSubs(map)
      setLoading(false)
    }
    load()
  }, [])

  const openDetail = (p: any) => { setActive(p); setView('detail') }
  
  const openSubmit = (p: any) => {
    const sub = subs[p.id]
    setForm({ github_url: sub?.github_url??'', live_url: sub?.live_url??'', notes: sub?.notes??'' })
    setFile(null)
    setActive(p)
    setView('submit')
  }

  const updateStatus = async (status: string) => {
    if (!userId || !active) return
    setSaving(true)
    const { data } = await sb.from('project_submissions').upsert({
      project_id: active.id, student_id: userId, status,
      updated_at: new Date().toISOString(),
    }, { onConflict:'project_id,student_id' }).select().single()
    if (data) { setSubs(prev => ({ ...prev, [active.id]: data })) }
    setSaving(false)
    showToast(`Status updated to ${status.replace('_',' ')}`)
  }

  const submitProject = async () => {
    if (!userId || !active) return
    setSaving(true)
    let fileUrl: string|null = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/projects/${active.id}-${Date.now()}.${ext}`
      const { data: up } = await sb.storage.from('ai-journey').upload(path, file, { upsert:true })
      if (up) {
        const { data: url } = sb.storage.from('ai-journey').getPublicUrl(up.path)
        fileUrl = url.publicUrl
      }
    }

    const { data } = await sb.from('project_submissions').upsert({
      project_id: active.id, student_id: userId,
      status: 'submitted',
      github_url: form.github_url || null,
      live_url: form.live_url || null,
      notes: form.notes || null,
      proof_url: fileUrl,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict:'project_id,student_id' }).select().single()

    if (data) setSubs(prev => ({ ...prev, [active.id]: data }))
    setSaving(false)
    showToast('🎉 Project submitted for review!')
    setView('detail')
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:T.slate, fontFamily:'Inter,sans-serif' }}>Loading projects…</div>

  const approvedCount = Object.values(subs).filter((s:any) => s.status==='approved').length

  // ── SUBMIT VIEW ──────────────────────────────────────────────────────────
  if (view === 'submit' && active) {
    const sub = subs[active.id]
    return (
      <div style={{ fontFamily:'Inter,sans-serif', minHeight:'100vh', background:T.bg, padding:'16px 16px 24px' }}>
        <button onClick={() => setView('detail')} style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← Back</button>
        <div style={{ fontSize:18, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', marginBottom:4 }}>Submit Project</div>
        <div style={{ fontSize:13, color:T.slate, marginBottom:20 }}>{active.title}</div>

        {/* File upload */}
        <div style={{ background:T.navy2, border:`2px dashed ${file ? T.emerald : T.border}`, borderRadius:14, padding:20, marginBottom:12, textAlign:'center', cursor:'pointer' }}
          onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*,.pdf,video/*,.zip" style={{ display:'none' }}
            onChange={e => setFile(e.target.files?.[0]??null)} />
          {file ? (
            <div>
              <div style={{ fontSize:24, marginBottom:6 }}>📁</div>
              <div style={{ fontSize:13, color:T.emerald, fontWeight:600 }}>{file.name}</div>
              <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{(file.size/1024/1024).toFixed(1)} MB</div>
              <button onClick={e=>{e.stopPropagation();setFile(null)}} style={{ marginTop:8, fontSize:11, color:T.red, background:'none', border:'none', cursor:'pointer' }}>Remove</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
              <div style={{ fontSize:14, color:T.white, fontWeight:600 }}>Upload file (optional)</div>
              <div style={{ fontSize:12, color:T.slate, marginTop:4 }}>Screenshot · ZIP · PDF · Video demo</div>
            </div>
          )}
        </div>

        {[
          { key:'github_url', label:'GitHub Repository URL', placeholder:'https://github.com/rishona/project-name', icon:'🐙' },
          { key:'live_url',   label:'Live Demo URL (optional)', placeholder:'https://your-project.vercel.app', icon:'🌐' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>{f.label}</label>
            <div style={{ display:'flex', alignItems:'center', background:T.navy2, border:`1px solid ${(form as any)[f.key] ? T.indigo : T.border}`, borderRadius:10, overflow:'hidden' }}>
              <span style={{ padding:'0 12px', fontSize:18 }}>{f.icon}</span>
              <input value={(form as any)[f.key]} onChange={e => setForm(prev => ({...prev,[f.key]:e.target.value}))}
                placeholder={f.placeholder}
                style={{ flex:1, padding:'11px 12px 11px 0', background:'transparent', border:'none', color:T.white, fontSize:13, outline:'none' }} />
            </div>
          </div>
        ))}

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>Notes for Tushar</label>
          <textarea value={form.notes} onChange={e => setForm(prev=>({...prev,notes:e.target.value}))}
            placeholder="What did you build? What was the hardest part? What are you most proud of?"
            rows={5}
            style={{ width:'100%', padding:'11px 14px', background:T.navy2, border:`1px solid ${form.notes ? T.indigo : T.border}`, borderRadius:10, color:T.white, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', lineHeight:1.6 }} />
        </div>

        <button onClick={submitProject} disabled={saving}
          style={{ width:'100%', padding:15, background: saving ? T.navy3 : T.indigo, border:'none', borderRadius:12, color: saving ? T.slate : '#fff', fontSize:15, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Submitting…' : '📤 Submit for Tushar\'s Review'}
        </button>
      </div>
    )
  }

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === 'detail' && active) {
    const sub = subs[active.id]
    const status = sub?.status ?? 'not_started'
    const st = STATUS[status]
    const diff = DIFF[active.difficulty] ?? DIFF.beginner

    return (
      <div style={{ fontFamily:'Inter,sans-serif', minHeight:'100vh', background:T.bg }}>
        {toast && <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:200, background:T.emerald, color:'#fff', padding:'10px 20px', borderRadius:30, fontSize:13, fontWeight:600, whiteSpace:'nowrap' }}>{toast}</div>}
        
        <div style={{ padding:'16px 16px 0' }}>
          <button onClick={() => setView('list')} style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← All Projects</button>
        </div>

        {/* Header */}
        <div style={{ padding:'0 16px 16px', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:`${diff.color}20`, color:diff.color }}>
              {diff.label}
            </span>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.color, border:`1px solid ${st.color}30` }}>
              {st.emoji} {st.label}
            </span>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:T.navy2, color:T.slate, border:`1px solid ${T.border}` }}>
              ~{active.estimated_hours}
            </span>
          </div>
          <div style={{ fontSize:11, color:T.slate, marginBottom:6 }}>Project {active.project_number}</div>
          <div style={{ fontSize:22, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1.3, marginBottom:6 }}>{active.title}</div>
          <div style={{ fontSize:14, color:T.slate }}>{active.tagline}</div>
        </div>

        <div style={{ padding:'16px 16px 24px' }}>
          {/* What you build */}
          <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
            <div style={{ fontSize:11, color:T.indigo, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>🛠️ What You Build</div>
            <div style={{ fontSize:14, color:T.white, lineHeight:1.8 }}>{active.what_you_build}</div>
          </div>

          {/* Why it matters */}
          <div style={{ background:`${T.indigo}10`, border:`1px solid ${T.indigo}25`, borderRadius:14, padding:16, marginBottom:12 }}>
            <div style={{ fontSize:11, color:T.indigo, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>💡 Why This Matters</div>
            <div style={{ fontSize:14, color:T.slate, lineHeight:1.8 }}>{active.why_it_matters}</div>
          </div>

          {/* Tech stack */}
          <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
            <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Tech Stack</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(active.tech_stack ?? []).map((t:string) => (
                <div key={t} style={{ padding:'6px 12px', borderRadius:20, background:`${T.indigo}15`, border:`1px solid ${T.indigo}30`, fontSize:13, color:T.indigoL }}>{t}</div>
              ))}
            </div>
          </div>

          {/* Submitted links */}
          {sub?.github_url && (
            <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
              <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Your Submission</div>
              <a href={sub.github_url} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:T.indigo, textDecoration:'none', marginBottom:8 }}>
                🐙 <span style={{ textDecoration:'underline' }}>{sub.github_url}</span>
              </a>
              {sub.live_url && (
                <a href={sub.live_url} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:T.emerald, textDecoration:'none', marginBottom:8 }}>
                  🌐 <span style={{ textDecoration:'underline' }}>{sub.live_url}</span>
                </a>
              )}
              {sub.notes && <div style={{ fontSize:13, color:T.slate, lineHeight:1.6, marginTop:8, fontStyle:'italic' }}>&ldquo;{sub.notes}&rdquo;</div>}
            </div>
          )}

          {/* Approval feedback */}
          {status === 'approved' && sub?.parent_feedback && (
            <div style={{ background:`${T.amber}10`, border:`1px solid ${T.amber}30`, borderRadius:14, padding:16, marginBottom:12 }}>
              <div style={{ fontSize:11, color:T.amber, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>✓ Tushar&apos;s Feedback</div>
              <div style={{ fontSize:14, color:T.white, lineHeight:1.7 }}>{sub.parent_feedback}</div>
            </div>
          )}

          {/* Status stepper — only show if not approved */}
          {status !== 'approved' && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Update Status</div>
              <div style={{ display:'flex', gap:8 }}>
                {(['not_started','in_progress'] as const).map(s => {
                  const st2 = STATUS[s]
                  return (
                    <button key={s} onClick={() => updateStatus(s)} disabled={saving || status === s}
                      style={{ flex:1, padding:'10px 6px', borderRadius:10,
                        border:`1px solid ${status===s ? st2.color+'60' : T.border}`,
                        background: status===s ? st2.bg : T.navy2,
                        color: status===s ? st2.color : T.slate,
                        cursor: status===s ? 'default' : 'pointer', fontSize:12, fontWeight:600 }}>
                      {st2.emoji} {st2.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {status !== 'approved' && (
            <button onClick={() => openSubmit(active)}
              style={{ width:'100%', padding:15, background: status==='submitted' ? T.navy2 : T.indigo,
                border: status==='submitted' ? `1px solid ${T.border}` : 'none',
                borderRadius:12, color: status==='submitted' ? T.slate : '#fff',
                fontSize:15, fontWeight:700, cursor:'pointer' }}>
              {status === 'submitted' ? '✏️ Edit Submission' : '📤 Submit for Review'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      {toast && <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:200, background:T.emerald, color:'#fff', padding:'10px 20px', borderRadius:30, fontSize:13, fontWeight:600, whiteSpace:'nowrap' }}>{toast}</div>}

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>Projects</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{approvedCount} approved · {projects.length} total · 3 years of building</div>
      </div>

      {/* Progress */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Complete</span>
          <span style={{ fontSize:13, fontWeight:700, color:T.emerald }}>{approvedCount} / {projects.length}</span>
        </div>
        <div style={{ height:6, background:T.navy3, borderRadius:3 }}>
          <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${T.emerald},${T.indigo})`, width:`${projects.length ? Math.round((approvedCount/projects.length)*100) : 0}%` }} />
        </div>
      </div>

      {projects.map(p => {
        const sub = subs[p.id]
        const status = sub?.status ?? 'not_started'
        const st = STATUS[status]
        const diff = DIFF[p.difficulty] ?? DIFF.beginner
        return (
          <div key={p.id} onClick={() => openDetail(p)}
            style={{ background: st.bg, border:`1px solid ${status==='approved'?T.emerald+'50':status==='submitted'?T.indigo+'50':status==='in_progress'?T.amber+'50':T.border}`,
              borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1, paddingRight:10 }}>
                <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${diff.color}20`, color:diff.color }}>{diff.label}</span>
                  <span style={{ fontSize:10, color:T.slate }}>P{p.project_number}</span>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:T.white, lineHeight:1.3, marginBottom:4 }}>{p.title}</div>
                <div style={{ fontSize:12, color:T.slate, lineHeight:1.4 }}>{p.tagline}</div>
              </div>
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:22 }}>{st.emoji}</div>
                <div style={{ fontSize:9, color:st.color, marginTop:2, whiteSpace:'nowrap' }}>{st.label}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
              {(p.tech_stack??[]).slice(0,3).map((t:string) => (
                <span key={t} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${T.indigo}15`, color:T.indigoL }}>{t}</span>
              ))}
              <span style={{ fontSize:10, color:T.slate }}>~{p.estimated_hours}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
