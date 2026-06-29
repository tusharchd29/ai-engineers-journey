'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

const STATUS_CONFIG: Record<string, { label:string; color:string; emoji:string }> = {
  not_started: { label:'Not started', color:T.slate,   emoji:'⭕' },
  in_progress:  { label:'In progress', color:T.amber,   emoji:'🔨' },
  submitted:    { label:'Submitted',   color:T.indigo,  emoji:'📤' },
  approved:     { label:'Approved ✓',  color:T.emerald, emoji:'✅' },
}

const DIFF: Record<string,string> = { beginner:'🟢 Beginner', intermediate:'🟡 Intermediate', advanced:'🔴 Advanced' }

export default function ProjectsPage() {
  const [projects, setProjects]       = useState<any[]>([])
  const [subs, setSubs]               = useState<Record<string,any>>({})
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<any>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [form, setForm]               = useState({ github_url:'', live_url:'', notes:'' })
  const [saving, setSaving]           = useState(false)
  const [userId, setUserId]           = useState<string|null>(null)
  const sb = createClient()

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
      const subMap: Record<string,any> = {}
      for (const sub of s ?? []) subMap[sub.project_id] = sub
      setSubs(subMap)
      setLoading(false)
    }
    load()
  }, [])

  const openProject = (p: any) => {
    const sub = subs[p.id]
    setForm({ github_url: sub?.github_url ?? '', live_url: sub?.live_url ?? '', notes: sub?.notes ?? '' })
    setSelected(p)
    setSubmitting(false)
  }

  const updateStatus = async (status: string) => {
    if (!userId || !selected) return
    setSaving(true)
    const payload: any = { project_id: selected.id, student_id: userId, status, updated_at: new Date().toISOString() }
    if (status === 'submitted') { payload.submitted_at = new Date().toISOString(); Object.assign(payload, form) }
    const { data } = await sb.from('project_submissions').upsert(payload, { onConflict:'project_id,student_id' }).select().single()
    if (data) setSubs(prev => ({ ...prev, [selected.id]: data }))
    setSaving(false); setSubmitting(false)
  }

  if (loading) return <div style={{ padding:32, color:T.slate, textAlign:'center' }}>Loading projects…</div>

  const done = Object.values(subs).filter((s:any) => s.status === 'approved').length

  // Project detail view
  if (selected) {
    const sub = subs[selected.id]
    const status = sub?.status ?? 'not_started'
    const sc = STATUS_CONFIG[status]

    return (
      <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
        <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← All Projects</button>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:T.slate, marginBottom:4 }}>Project {selected.project_number} · {DIFF[selected.difficulty]}</div>
            <div style={{ fontSize:20, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white, lineHeight:1.3 }}>{selected.title}</div>
            <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{selected.tagline}</div>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => status !== 'approved' && updateStatus(k)}
              style={{ flex:1, padding:'8px 4px', borderRadius:8, border:`1px solid ${status===k ? v.color+'60' : T.border}`, background: status===k ? `${v.color}15` : T.navy2, cursor: status==='approved' ? 'default' : 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <span style={{ fontSize:14 }}>{v.emoji}</span>
              <span style={{ fontSize:9, color: status===k ? v.color : T.slate }}>{v.label}</span>
            </button>
          ))}
        </div>

        {/* What you build */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:16, marginBottom:10 }}>
          <div style={{ fontSize:11, color:T.indigo, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>What You Build</div>
          <div style={{ fontSize:13, color:T.white, lineHeight:1.7 }}>{selected.what_you_build}</div>
        </div>

        {/* Why it matters */}
        <div style={{ background:`${T.indigo}10`, border:`1px solid ${T.indigo}25`, borderRadius:12, padding:16, marginBottom:10 }}>
          <div style={{ fontSize:11, color:T.indigo, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Why This Matters</div>
          <div style={{ fontSize:13, color:T.slate, lineHeight:1.7 }}>{selected.why_it_matters}</div>
        </div>

        {/* Tech stack */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:16, marginBottom:10 }}>
          <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Tech Stack · ~{selected.estimated_hours}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {(selected.tech_stack ?? []).map((t: string) => (
              <div key={t} style={{ padding:'4px 10px', borderRadius:20, background:`${T.indigo}15`, border:`1px solid ${T.indigo}30`, fontSize:12, color:T.indigoL }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Submission */}
        {(status === 'in_progress' || submitting) && (
          <div style={{ background:T.navy2, border:`1px solid ${T.amber}30`, borderRadius:12, padding:16, marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.white, marginBottom:12 }}>Submit Your Work</div>
            {[
              { key:'github_url', label:'GitHub URL', placeholder:'https://github.com/rishona/project-name' },
              { key:'live_url', label:'Live Demo URL (optional)', placeholder:'https://project.vercel.app' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:4 }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width:'100%', padding:'9px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:4 }}>Notes for Tushar</label>
            <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="What did you build? What was hard? What are you proud of?"
              rows={3}
              style={{ width:'100%', padding:'9px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', marginBottom:12 }} />
            <button onClick={() => updateStatus('submitted')} disabled={saving}
              style={{ width:'100%', padding:12, background:T.indigo, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {saving ? 'Saving…' : '📤 Submit Project'}
            </button>
          </div>
        )}

        {/* Approved feedback */}
        {status === 'approved' && sub?.parent_feedback && (
          <div style={{ background:`${T.emerald}10`, border:`1px solid ${T.emerald}30`, borderRadius:12, padding:16, marginBottom:10 }}>
            <div style={{ fontSize:11, color:T.emerald, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Tushar&apos;s Feedback</div>
            <div style={{ fontSize:13, color:T.white, lineHeight:1.6 }}>{sub.parent_feedback}</div>
          </div>
        )}

        {/* Links if submitted */}
        {sub?.github_url && (
          <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
            <a href={sub.github_url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:T.indigo, textDecoration:'none', display:'block', marginBottom:6 }}>🐙 {sub.github_url}</a>
            {sub.live_url && <a href={sub.live_url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:T.emerald, textDecoration:'none' }}>🌐 {sub.live_url}</a>}
          </div>
        )}

        {status === 'in_progress' && !submitting && (
          <button onClick={() => setSubmitting(true)}
            style={{ width:'100%', padding:12, background:T.indigo, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', marginTop:4 }}>
            📤 Submit for Review
          </button>
        )}
      </div>
    )
  }

  // List view
  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>Projects</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{done} approved · {projects.length - done} remaining · 3 years of building</div>
      </div>

      {/* Progress */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Projects Complete</span>
          <span style={{ fontSize:13, fontWeight:700, color:T.emerald }}>{done} / {projects.length}</span>
        </div>
        <div style={{ height:6, background:T.navy3, borderRadius:3 }}>
          <div style={{ height:'100%', borderRadius:3, background:T.emerald, width:`${projects.length ? Math.round((done/projects.length)*100) : 0}%` }} />
        </div>
      </div>

      {projects.map(p => {
        const sub = subs[p.id]
        const status = sub?.status ?? 'not_started'
        const sc = STATUS_CONFIG[status]
        return (
          <div key={p.id} onClick={() => openProject(p)}
            style={{ background:T.navy2, border:`1px solid ${status==='approved' ? T.emerald+'40' : status==='in_progress' ? T.amber+'40' : T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:10, cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:T.slate, marginBottom:4 }}>Project {p.project_number} · {DIFF[p.difficulty]}</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.white, marginBottom:4, lineHeight:1.3 }}>{p.title}</div>
                <div style={{ fontSize:12, color:T.slate, lineHeight:1.5 }}>{p.tagline}</div>
              </div>
              <div style={{ flexShrink:0, marginLeft:10, textAlign:'center' }}>
                <div style={{ fontSize:20 }}>{sc.emoji}</div>
                <div style={{ fontSize:9, color:sc.color, marginTop:2, whiteSpace:'nowrap' }}>{sc.label}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
              {(p.tech_stack ?? []).slice(0,3).map((t:string) => (
                <span key={t} style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:`${T.indigo}15`, color:T.indigoL }}>{t}</span>
              ))}
              <span style={{ fontSize:10, color:T.slate }}>~{p.estimated_hours}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
