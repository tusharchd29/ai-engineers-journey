'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0',
  purple:'#7C6FE0', purpleL:'#A99EF0', text:'#2D2352', muted:'#8B82B8',
  peach:'#F59E6C', mint:'#5EC990', sky:'#64BFDF', red:'#F27171',
}

const STATUS: Record<string,{label:string;color:string;emoji:string;bg:string}> = {
  not_started: { label:'Not started', color:T.muted,   emoji:'⭕', bg:T.surface   },
  in_progress:  { label:'In progress', color:T.peach,   emoji:'🔨', bg:'#FFF3EA'  },
  submitted:    { label:'Submitted',   color:T.purple,  emoji:'📤', bg:T.surface2 },
  approved:     { label:'Approved',    color:T.mint,    emoji:'✅', bg:'#EDFBF4'  },
}
const DIFF: Record<string,{label:string;color:string;bg:string}> = {
  beginner:     { label:'Beginner',     color:T.mint,  bg:'#EDFBF4' },
  intermediate: { label:'Intermediate', color:T.peach, bg:'#FFF3EA' },
  advanced:     { label:'Advanced',     color:T.red,   bg:'#FFF0F0' },
}
const DIFF_STARS: Record<string,string> = {
  beginner: '⭐', intermediate: '⭐⭐', advanced: '⭐⭐⭐',
}

interface Props { userId:string; initialProjects:any[]; initialSubs:Record<string,any> }

export default function ProjectsClient({ userId, initialProjects, initialSubs }: Props) {
  const [subs, setSubs]     = useState(initialSubs)
  const [view, setView]     = useState<'list'|'detail'|'submit'>('list')
  const [active, setActive] = useState<any>(null)
  const [form, setForm]     = useState({ github_url:'', live_url:'', notes:'' })
  const [file, setFile]     = useState<File|null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sb = createClient()
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(null),2500) }

  const openDetail = (p:any) => { setActive(p); setView('detail') }
  const openSubmit = (p:any) => {
    const sub = subs[p.id]
    setForm({ github_url:sub?.github_url??'', live_url:sub?.live_url??'', notes:sub?.notes??'' })
    setFile(null); setActive(p); setView('submit')
  }

  const updateStatus = async (status:string) => {
    if (!active) return
    setSaving(true)
    const { data } = await sb.from('project_submissions').upsert({
      project_id:active.id, student_id:userId, status, updated_at:new Date().toISOString()
    }, { onConflict:'project_id,student_id' }).select().single()
    if (data) setSubs(p => ({ ...p, [active.id]:data }))
    setSaving(false); showToast(`Status: ${status.replace('_',' ')}`)
  }

  const submitProject = async () => {
    if (!active) return
    setSaving(true)
    let fileUrl:string|null = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/projects/${active.id}-${Date.now()}.${ext}`
      const { data:up } = await sb.storage.from('ai-journey').upload(path, file, { upsert:true })
      if (up) { const { data:url } = sb.storage.from('ai-journey').getPublicUrl(up.path); fileUrl = url.publicUrl }
    }
    const { data } = await sb.from('project_submissions').upsert({
      project_id:active.id, student_id:userId, status:'submitted',
      github_url:form.github_url||null, live_url:form.live_url||null, notes:form.notes||null,
      proof_url:fileUrl, submitted_at:new Date().toISOString(), updated_at:new Date().toISOString(),
    }, { onConflict:'project_id,student_id' }).select().single()
    if (data) setSubs(p => ({ ...p, [active.id]:data }))
    setSaving(false); showToast('🎉 Submitted!'); setView('detail')
  }

  const approvedCount = Object.values(subs).filter((s:any)=>s.status==='approved').length
  const ToastEl = () => toast ? <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:200, background:T.mint, color:'#fff', padding:'10px 20px', borderRadius:30, fontSize:13, fontWeight:600, whiteSpace:'nowrap', pointerEvents:'none' }}>{toast}</div> : null

  // ── SUBMIT VIEW ───────────────────────────────────────────────────────────
  if (view==='submit' && active) return (
    <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', padding:'16px 16px 32px' }}>
      <ToastEl />
      <button onClick={()=>setView('detail')} style={{ background:'none',border:'none',color:T.muted,fontSize:14,cursor:'pointer',marginBottom:16 }}>← Back</button>
      <div style={{ fontSize:18, fontWeight:700, color:T.text, fontFamily:'"Space Grotesk",sans-serif', marginBottom:4 }}>Submit Project</div>
      <div style={{ fontSize:13, color:T.muted, marginBottom:20 }}>{active.title}</div>

      <div style={{ background:T.surface, border:`2px dashed ${file?T.mint:T.border}`, borderRadius:14, padding:20, marginBottom:12, textAlign:'center', cursor:'pointer' }}
        onClick={()=>fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*,.pdf,video/*,.zip" style={{ display:'none' }} onChange={e=>setFile(e.target.files?.[0]??null)} />
        {file ? (
          <div>
            <div style={{ fontSize:28,marginBottom:6 }}>📁</div>
            <div style={{ fontSize:13,color:T.mint,fontWeight:600 }}>{file.name}</div>
            <div style={{ fontSize:11,color:T.muted,marginTop:2 }}>{(file.size/1024/1024).toFixed(1)} MB</div>
            <button onClick={e=>{e.stopPropagation();setFile(null)}} style={{ marginTop:8,fontSize:11,color:T.red,background:'none',border:'none',cursor:'pointer' }}>Remove</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:36,marginBottom:8 }}>📁</div>
            <div style={{ fontSize:14,color:T.text,fontWeight:600 }}>Upload file (optional)</div>
            <div style={{ fontSize:12,color:T.muted,marginTop:4 }}>Screenshot · ZIP · PDF · Video demo</div>
          </div>
        )}
      </div>

      {[{key:'github_url',label:'GitHub URL',ph:'https://github.com/rishona/project',icon:'🐙'},
        {key:'live_url',label:'Live Demo (optional)',ph:'https://project.vercel.app',icon:'🌐'}].map(f=>(
        <div key={f.key} style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,color:T.muted,display:'block',marginBottom:6 }}>{f.label}</label>
          <div style={{ display:'flex', alignItems:'center', background:T.surface, border:`1px solid ${(form as any)[f.key]?T.purple:T.border}`, borderRadius:10, overflow:'hidden' }}>
            <span style={{ padding:'0 12px',fontSize:18 }}>{f.icon}</span>
            <input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph}
              style={{ flex:1,padding:'11px 12px 11px 0',background:'transparent',border:'none',color:T.text,fontSize:13,outline:'none' }} />
          </div>
        </div>
      ))}

      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:11,color:T.muted,display:'block',marginBottom:6 }}>Notes for Tushar</label>
        <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
          placeholder="What did you build? What was hard? What are you proud of?"
          rows={5} style={{ width:'100%',padding:'11px 14px',background:T.surface,border:`1px solid ${form.notes?T.purple:T.border}`,borderRadius:10,color:T.text,fontSize:13,resize:'none',boxSizing:'border-box',fontFamily:'Inter,sans-serif',lineHeight:1.6 }} />
      </div>

      <button onClick={submitProject} disabled={saving}
        style={{ width:'100%',padding:15,background:saving?T.surface2:T.purple,border:'none',borderRadius:12,color:saving?T.muted:'#fff',fontSize:15,fontWeight:700,cursor:saving?'not-allowed':'pointer' }}>
        {saving?'Submitting…':'📤 Submit for Tushar\'s Review'}
      </button>
    </div>
  )

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (view==='detail' && active) {
    const sub = subs[active.id]; const status = sub?.status??'not_started'
    const st = STATUS[status]; const diff = DIFF[active.difficulty]??DIFF.beginner
    const stars = DIFF_STARS[active.difficulty] ?? '⭐⭐'
    const hasBrief = active.one_line_description || active.mission || active.problem_statement
      || (active.success_criteria && active.success_criteria.length > 0) || active.who_for || active.extra_note_body

    return (
      <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh' }}>
        <ToastEl />
        <div style={{ padding:'16px 16px 0' }}>
          <button onClick={()=>setView('list')} style={{ background:'none',border:'none',color:T.muted,fontSize:14,cursor:'pointer',marginBottom:16 }}>← All Projects</button>
        </div>
        <div style={{ padding:'0 16px', borderBottom:`1px solid ${T.border}`, paddingBottom:16, marginBottom:16 }}>
          <div style={{ display:'flex',gap:8,marginBottom:10,flexWrap:'wrap' }}>
            <span style={{ fontSize:11,padding:'3px 10px',borderRadius:20,background:diff.bg,color:diff.color }}>{diff.label}</span>
            <span style={{ fontSize:11,padding:'3px 10px',borderRadius:20,background:st.bg,color:st.color,border:`1px solid ${st.color}20` }}>{st.emoji} {st.label}</span>
            <span style={{ fontSize:11,padding:'3px 10px',borderRadius:20,background:T.surface,color:T.muted,border:`1px solid ${T.border}` }}>~{active.estimated_hours}</span>
          </div>
          <div style={{ fontSize:11,color:T.muted,marginBottom:6 }}>Project {active.project_number}</div>
          <div style={{ fontSize:22,fontWeight:700,color:T.text,fontFamily:'"Space Grotesk",sans-serif',lineHeight:1.3,marginBottom:6 }}>{active.title}</div>
          <div style={{ fontSize:14,color:T.muted }}>{active.tagline}</div>
        </div>
        <div style={{ padding:'0 16px 32px' }}>

          {/* ── PROJECT BRIEF CARD ── */}
          {hasBrief && (
            <div style={{ background:T.surface, border:`1.5px solid ${T.purple}30`, borderRadius:16, padding:18, marginBottom:16, boxShadow:'0 2px 12px rgba(124,111,224,0.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <span style={{ fontSize:18 }}>📋</span>
                <div style={{ fontSize:13, fontWeight:700, color:T.purple, textTransform:'uppercase', letterSpacing:'0.06em' }}>Project Brief &amp; Mission</div>
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Phase / Year</div>
                  <div style={{ fontSize:13, color:T.text, fontWeight:600 }}>{active.phase_id ? `Phase · Year` : '—'}</div>
                </div>
                {active.rank_label && (
                  <div>
                    <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Rank</div>
                    <div style={{ fontSize:13, color:T.purple, fontWeight:700 }}>{active.rank_label}</div>
                  </div>
                )}
                {active.build_weeks && (
                  <div>
                    <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Build Time</div>
                    <div style={{ fontSize:13, color:T.text, fontWeight:600 }}>{active.build_weeks}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Difficulty</div>
                  <div style={{ fontSize:13, color:T.peach, fontWeight:700 }}>{stars} <span style={{ color:T.muted, fontWeight:400 }}>({diff.label})</span></div>
                </div>
              </div>

              {active.one_line_description && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>One-line description</div>
                  <div style={{ fontSize:14, color:T.text, lineHeight:1.7, fontStyle:'italic' }}>{active.one_line_description}</div>
                </div>
              )}

              {active.mission && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Mission</div>
                  <div style={{ fontSize:14, color:T.text, lineHeight:1.7 }}>{active.mission}</div>
                </div>
              )}

              {active.problem_statement && (
                <div style={{ marginBottom:14, background:T.surface2, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Problem Statement</div>
                  <div style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{active.problem_statement}</div>
                </div>
              )}

              {active.success_criteria && active.success_criteria.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Success Criteria</div>
                  {active.success_criteria.map((c:string, i:number) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                      <span style={{ color:T.mint, fontSize:13, marginTop:1 }}>✓</span>
                      <span style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {active.who_for && (
                <div style={{ marginBottom:active.extra_note_body ? 14 : 0 }}>
                  <div style={{ fontSize:11, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Who This Is For</div>
                  <div style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{active.who_for}</div>
                </div>
              )}

              {active.extra_note_body && (
                <div style={{ background:'#FFF3EA', border:`1px solid ${T.peach}30`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:T.peach, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{active.extra_note_title ?? 'Note'}</div>
                  <div style={{ fontSize:13, color:T.text, lineHeight:1.7 }}>{active.extra_note_body}</div>
                </div>
              )}
            </div>
          )}

          <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:12 }}>
            <div style={{ fontSize:11,color:T.purple,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10 }}>🛠️ What You Build</div>
            <div style={{ fontSize:14,color:T.text,lineHeight:1.8 }}>{active.what_you_build}</div>
          </div>
          <div style={{ background:T.surface2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:12 }}>
            <div style={{ fontSize:11,color:T.purple,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10 }}>💡 Why This Matters</div>
            <div style={{ fontSize:14,color:T.muted,lineHeight:1.8 }}>{active.why_it_matters}</div>
          </div>
          <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:12 }}>
            <div style={{ fontSize:11,color:T.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:12 }}>Tech Stack</div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
              {(active.tech_stack??[]).map((t:string)=>(
                <div key={t} style={{ padding:'6px 12px',borderRadius:20,background:T.surface2,border:`1px solid ${T.border}`,fontSize:13,color:T.purple }}>{t}</div>
              ))}
            </div>
          </div>
          {sub?.github_url && (
            <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:12 }}>
              <div style={{ fontSize:11,color:T.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10 }}>Your Submission</div>
              <a href={sub.github_url} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:8,fontSize:14,color:T.purple,textDecoration:'none',marginBottom:sub.live_url?8:0 }}>🐙 <span>{sub.github_url}</span></a>
              {sub.live_url && <a href={sub.live_url} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:8,fontSize:14,color:T.mint,textDecoration:'none',marginBottom:sub.notes?8:0 }}>🌐 <span>{sub.live_url}</span></a>}
              {sub.notes && <div style={{ fontSize:13,color:T.muted,lineHeight:1.6,fontStyle:'italic' }}>&ldquo;{sub.notes}&rdquo;</div>}
            </div>
          )}
          {status==='approved' && sub?.parent_feedback && (
            <div style={{ background:'#FFF3EA',border:`1px solid ${T.peach}40`,borderRadius:14,padding:16,marginBottom:12 }}>
              <div style={{ fontSize:11,color:T.peach,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8 }}>✓ Tushar&apos;s Feedback</div>
              <div style={{ fontSize:14,color:T.text,lineHeight:1.7 }}>{sub.parent_feedback}</div>
            </div>
          )}
          {status!=='approved' && (
            <div style={{ display:'flex',gap:8,marginBottom:12 }}>
              {(['not_started','in_progress'] as const).map(s=>{
                const st2=STATUS[s]; return (
                  <button key={s} onClick={()=>updateStatus(s)} disabled={saving||status===s}
                    style={{ flex:1,padding:'10px 6px',borderRadius:10,border:`1px solid ${status===s?st2.color+'40':T.border}`,background:status===s?st2.bg:T.surface,color:status===s?st2.color:T.muted,cursor:status===s?'default':'pointer',fontSize:12,fontWeight:600 }}>
                    {st2.emoji} {st2.label}
                  </button>
                )
              })}
            </div>
          )}
          {status!=='approved' && (
            <button onClick={()=>openSubmit(active)}
              style={{ width:'100%',padding:15,background:status==='submitted'?T.surface:T.purple,border:status==='submitted'?`1px solid ${T.border}`:'none',borderRadius:12,color:status==='submitted'?T.muted:'#fff',fontSize:15,fontWeight:700,cursor:'pointer' }}>
              {status==='submitted'?'✏️ Edit Submission':'📤 Submit for Review'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <ToastEl />
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22,fontWeight:700,fontFamily:'"Space Grotesk",sans-serif',color:T.text }}>Projects</div>
        <div style={{ fontSize:13,color:T.muted,marginTop:4 }}>{approvedCount} approved · {initialProjects.length} total · Tap to open</div>
      </div>
      <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'12px 16px',marginBottom:16 }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
          <span style={{ fontSize:12,color:T.muted }}>Complete</span>
          <span style={{ fontSize:13,fontWeight:700,color:T.mint }}>{approvedCount} / {initialProjects.length}</span>
        </div>
        <div style={{ height:6,background:T.surface2,borderRadius:3 }}>
          <div style={{ height:'100%',borderRadius:3,background:`linear-gradient(90deg,${T.mint},${T.purple})`,width:`${initialProjects.length?Math.round((approvedCount/initialProjects.length)*100):0}%` }} />
        </div>
      </div>
      {initialProjects.map(p => {
        const sub=subs[p.id]; const status=sub?.status??'not_started'
        const st=STATUS[status]; const diff=DIFF[p.difficulty]??DIFF.beginner
        return (
          <div key={p.id} onClick={()=>openDetail(p)}
            style={{ background:st.bg,border:`1px solid ${status==='approved'?T.mint+'50':status==='submitted'?T.purple+'50':status==='in_progress'?T.peach+'50':T.border}`,borderRadius:14,padding:'14px 16px',marginBottom:10,cursor:'pointer',
              boxShadow:'0 1px 6px rgba(124,111,224,0.04)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
              <div style={{ flex:1,paddingRight:10 }}>
                <div style={{ display:'flex',gap:8,marginBottom:6 }}>
                  <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:diff.bg,color:diff.color }}>{diff.label}</span>
                  <span style={{ fontSize:10,color:T.muted }}>P{p.project_number}</span>
                </div>
                <div style={{ fontSize:15,fontWeight:700,color:T.text,lineHeight:1.3,marginBottom:4 }}>{p.title}</div>
                <div style={{ fontSize:12,color:T.muted,lineHeight:1.4 }}>{p.tagline}</div>
              </div>
              <div style={{ textAlign:'center',flexShrink:0 }}>
                <div style={{ fontSize:22 }}>{st.emoji}</div>
                <div style={{ fontSize:9,color:st.color,marginTop:2,whiteSpace:'nowrap' }}>{st.label}</div>
              </div>
            </div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:10 }}>
              {(p.tech_stack??[]).slice(0,3).map((t:string)=>(
                <span key={t} style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:T.surface2,color:T.purple }}>{t}</span>
              ))}
              <span style={{ fontSize:10,color:T.muted }}>~{p.estimated_hours}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
