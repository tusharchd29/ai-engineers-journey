'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  bg:'#0A0F1E', navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47',
  indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC',
  amber:'#E8A838', emerald:'#10B981', red:'#EF4444'
}

interface Task {
  id: string; title: string; description: string|null; task_type: string
  time_estimate: string; task_order: number; resource_url: string|null; requires_proof: boolean
}
interface Completion {
  id?: string; task_id: string; proof_text: string|null; proof_url: string|null
  proof_file_path: string|null; github_hash: string|null; parent_approved: boolean; parent_notes: string|null
}
interface Phase {
  id: string; phase_name: string; label: string; year: number; month: number
  color: string; badge: string; is_active: boolean; phase_number: number
}
interface Props {
  userId: string
  activePhase: Phase|null
  allPhases: Phase[]
  initialTasks: Task[]
  initialCompletions: Completion[]
}

export default function TasksClient({ userId, activePhase, allPhases, initialTasks, initialCompletions }: Props) {
  const [selectedPhase, setSelectedPhase] = useState<Phase|null>(activePhase)
  const [tasks, setTasks]                 = useState<Task[]>(initialTasks)
  const [completions, setComps]           = useState<Record<string,Completion>>(() => {
    const m: Record<string,Completion> = {}
    for (const c of initialCompletions) m[c.task_id] = c
    return m
  })
  const [view, setView]             = useState<'list'|'detail'|'proof'>('list')
  const [activeTask, setActive]     = useState<Task|null>(null)
  const [proofText, setProofText]   = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [file, setFile]             = useState<File|null>(null)
  const [saving, setSaving]         = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(false)
  const [toast, setToast]           = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sb = createClient()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const switchPhase = async (phase: Phase) => {
    if (phase.id === selectedPhase?.id) return
    setLoadingPhase(true)
    setView('list')
    const { data } = await sb.from('tasks').select('*').eq('phase_id', phase.id).order('task_order')
    setTasks(data ?? [])
    setSelectedPhase(phase)
    setLoadingPhase(false)
  }

  const openDetail = (task: Task) => { setActive(task); setView('detail') }
  const openProof  = (task: Task) => {
    const ex = completions[task.id]
    setProofText(ex?.proof_text ?? '')
    setGithubLink(ex?.github_hash ?? '')
    setFile(null); setActive(task); setView('proof')
  }

  const markComplete = async () => {
    if (!activeTask) return
    setSaving(true)
    let fileUrl: string|null = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/tasks/${activeTask.id}-${Date.now()}.${ext}`
      const { data: up } = await sb.storage.from('ai-journey').upload(path, file, { upsert: true })
      if (up) {
        const { data: url } = sb.storage.from('ai-journey').getPublicUrl(up.path)
        fileUrl = url.publicUrl
      }
    }
    const { data, error } = await sb.from('task_completions').upsert({
      task_id: activeTask.id, student_id: userId,
      proof_text: proofText || null, github_hash: githubLink || null,
      proof_url: fileUrl, proof_file_path: null,
      proof_type: file ? 'file' : githubLink ? 'github' : proofText ? 'text' : 'self',
      parent_approved: false, completed_at: new Date().toISOString(),
    }, { onConflict: 'task_id,student_id' }).select().single()
    if (error) { showToast('Error saving — try again'); setSaving(false); return }
    if (data) setComps(prev => ({ ...prev, [activeTask.id]: data }))
    setSaving(false); showToast('✓ Marked complete!'); setView('list')
  }

  const untick = async (taskId: string) => {
    const { error } = await sb.from('task_completions')
      .delete().eq('task_id', taskId).eq('student_id', userId)
    if (!error) {
      setComps(prev => { const n = { ...prev }; delete n[taskId]; return n })
      showToast('Task unchecked'); setView('list')
    }
  }

  const doneCount = tasks.filter(t => completions[t.id]).length
  const pct       = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0
  const weekday   = tasks.filter(t => t.task_type === 'weekday')
  const weekend   = tasks.filter(t => t.task_type === 'weekend')
  const phaseColor = selectedPhase?.color ?? T.indigo

  // ── PROOF SHEET ─────────────────────────────────────────────────────────
  if (view === 'proof' && activeTask) return (
    <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', padding:'16px 16px 32px' }}>
      <button onClick={() => setView('detail')} style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← Back</button>
      <div style={{ fontSize:18, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', marginBottom:4 }}>Mark as Complete</div>
      <div style={{ fontSize:13, color:T.slate, marginBottom:20 }}>{activeTask.title}</div>
      {/* File upload */}
      <div style={{ background:T.navy2, border:`2px dashed ${file ? T.emerald : T.border}`, borderRadius:14, padding:20, marginBottom:12, textAlign:'center', cursor:'pointer' }}
        onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*,.pdf,video/*" style={{ display:'none' }}
          onChange={e => setFile(e.target.files?.[0] ?? null)} />
        {file ? (
          <div>
            <div style={{ fontSize:28, marginBottom:6 }}>📎</div>
            <div style={{ fontSize:13, color:T.emerald, fontWeight:600 }}>{file.name}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{(file.size/1024/1024).toFixed(1)} MB</div>
            <button onClick={e => { e.stopPropagation(); setFile(null) }}
              style={{ marginTop:8, fontSize:11, color:T.red, background:'none', border:'none', cursor:'pointer' }}>Remove</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:36, marginBottom:8 }}>📸</div>
            <div style={{ fontSize:14, color:T.white, fontWeight:600, marginBottom:4 }}>Upload proof</div>
            <div style={{ fontSize:12, color:T.slate }}>Screenshot · PDF · Photo · Video</div>
            <div style={{ fontSize:11, color:T.amber, marginTop:6 }}>Tap to choose from phone</div>
          </div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{ flex:1, height:1, background:T.border }} />
        <span style={{ fontSize:11, color:T.slate }}>or add notes</span>
        <div style={{ flex:1, height:1, background:T.border }} />
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>GitHub / link (optional)</label>
        <input value={githubLink} onChange={e => setGithubLink(e.target.value)}
          placeholder="https://github.com/rishona/..."
          style={{ width:'100%', padding:'11px 14px', background:T.navy2, border:`1px solid ${githubLink ? T.indigo : T.border}`, borderRadius:10, color:T.white, fontSize:13, boxSizing:'border-box' }} />
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>What did you do? (optional)</label>
        <textarea value={proofText} onChange={e => setProofText(e.target.value)}
          placeholder={`e.g. Completed "${activeTask.title}" — took notes, pushed to GitHub`} rows={4}
          style={{ width:'100%', padding:'11px 14px', background:T.navy2, border:`1px solid ${proofText ? T.indigo : T.border}`, borderRadius:10, color:T.white, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', lineHeight:1.6 }} />
      </div>
      <button onClick={markComplete} disabled={saving}
        style={{ width:'100%', padding:15, background: saving ? T.navy3 : T.emerald, border:'none', borderRadius:12, color: saving ? T.slate : '#fff', fontSize:15, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving…' : '✓ Mark Complete'}
      </button>
      <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:T.slate }}>Proof is optional — just tap Mark Complete to finish</div>
    </div>
  )

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === 'detail' && activeTask) {
    const comp  = completions[activeTask.id]
    const isDone = !!comp
    return (
      <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh' }}>
        <div style={{ padding:'16px 16px 0' }}>
          <button onClick={() => setView('list')} style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← Tasks</button>
        </div>
        <div style={{ padding:'0 16px 32px' }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:`${T.indigo}20`, color:T.indigoL }}>
              {activeTask.task_type === 'weekday' ? '📅 Mon–Fri · 30 min' : '🌅 Sat–Sun · 60 min'}
            </span>
            <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:T.navy2, color:T.slate, border:`1px solid ${T.border}` }}>
              ⏱ {activeTask.time_estimate}
            </span>
            {isDone && <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:`${T.emerald}20`, color:T.emerald }}>✓ Done</span>}
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1.3, marginBottom:16 }}>
            {activeTask.title}
          </div>
          {activeTask.description && (
            <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:18, marginBottom:12 }}>
              <div style={{ fontSize:11, color:T.indigo, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>What to do</div>
              <div style={{ fontSize:15, color:T.white, lineHeight:1.8 }}>{activeTask.description}</div>
            </div>
          )}
          {activeTask.resource_url && (
            <a href={activeTask.resource_url} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:`${T.indigo}10`, border:`1px solid ${T.indigo}30`, borderRadius:12, textDecoration:'none', marginBottom:12 }}>
              <span style={{ fontSize:24 }}>🔗</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:T.indigoL }}>Open Course / Resource</div>
                <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{activeTask.resource_url.replace('https://','').split('/')[0]}</div>
              </div>
              <span style={{ color:T.slate, fontSize:18 }}>→</span>
            </a>
          )}
          {isDone && (
            <div style={{ background:`${T.emerald}08`, border:`1px solid ${T.emerald}25`, borderRadius:14, padding:16, marginBottom:12 }}>
              <div style={{ fontSize:11, color:T.emerald, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
                {comp.parent_approved ? '✓ Approved by Tushar' : 'Submitted · Awaiting approval'}
              </div>
              {comp.proof_text && <div style={{ fontSize:14, color:T.white, lineHeight:1.7, marginBottom:8 }}>{comp.proof_text}</div>}
              {comp.github_hash && (
                <a href={comp.github_hash.startsWith('http') ? comp.github_hash : `https://${comp.github_hash}`}
                  target="_blank" rel="noreferrer"
                  style={{ display:'block', fontSize:13, color:T.indigo, textDecoration:'none', marginBottom:6 }}>🐙 {comp.github_hash}</a>
              )}
              {comp.proof_url && (
                <a href={comp.proof_url} target="_blank" rel="noreferrer"
                  style={{ display:'block', fontSize:13, color:T.amber, textDecoration:'none' }}>📎 View uploaded file</a>
              )}
              {!comp.proof_text && !comp.github_hash && !comp.proof_url && (
                <div style={{ fontSize:13, color:T.slate }}>Marked complete without proof.</div>
              )}
              {comp.parent_notes && (
                <div style={{ marginTop:12, padding:'10px 14px', background:T.navy2, borderRadius:10, fontSize:13, color:T.white, lineHeight:1.6 }}>
                  <strong style={{ color:T.amber }}>Tushar: </strong>{comp.parent_notes}
                </div>
              )}
            </div>
          )}
          {!isDone ? (
            <button onClick={() => openProof(activeTask)}
              style={{ width:'100%', padding:16, background:T.emerald, border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', marginTop:8 }}>
              ✓ Mark as Complete
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
              <button onClick={() => openProof(activeTask)}
                style={{ width:'100%', padding:13, background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, color:T.slate, fontSize:14, cursor:'pointer' }}>
                ✏️ Edit Proof
              </button>
              <button onClick={() => untick(activeTask.id)}
                style={{ width:'100%', padding:13, background:'transparent', border:`1px solid ${T.red}40`, borderRadius:12, color:T.red, fontSize:14, cursor:'pointer' }}>
                ✕ Unmark Complete
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  const renderTask = (task: Task) => {
    const isDone = !!completions[task.id]
    const comp   = completions[task.id]
    return (
      <div key={task.id} onClick={() => openDetail(task)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', marginBottom:8, cursor:'pointer',
          background: isDone ? `${T.emerald}08` : T.navy2,
          border:`1px solid ${comp?.parent_approved ? T.amber+'60' : isDone ? T.emerald+'30' : T.border}`,
          borderRadius:12 }}>
        <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background: isDone ? T.emerald : 'transparent', border:`2px solid ${isDone ? T.emerald : T.border}` }}>
          {isDone && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, color: isDone ? T.slate : T.white, fontWeight:500,
            textDecoration: isDone ? 'line-through' : 'none',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</div>
          <div style={{ display:'flex', gap:8, marginTop:3, alignItems:'center' }}>
            <span style={{ fontSize:11, color:T.slate }}>{task.time_estimate}</span>
            {task.resource_url && <span style={{ fontSize:10, color:T.indigo }}>🔗 course</span>}
            {comp?.proof_url && <span style={{ fontSize:10, color:T.amber }}>📎</span>}
            {comp?.github_hash && <span style={{ fontSize:10, color:T.indigo }}>🐙</span>}
            {comp?.parent_approved && <span style={{ fontSize:10, color:T.amber, fontWeight:700 }}>✓ approved</span>}
          </div>
        </div>
        <span style={{ color:T.slate, fontSize:18 }}>›</span>
      </div>
    )
  }

  return (
    <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh' }}>
      {toast && (
        <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:200,
          background:T.emerald, color:'#fff', padding:'10px 20px', borderRadius:30, fontSize:13, fontWeight:600, whiteSpace:'nowrap', pointerEvents:'none' }}>
          {toast}
        </div>
      )}

      <div style={{ padding:'16px 16px 8px' }}>
        {/* Header */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>My Tasks</div>
          <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
            {selectedPhase?.label ?? 'Select a phase'} · {doneCount}/{tasks.length} complete
          </div>
        </div>

        {/* Phase switcher */}
        <div style={{ overflowX:'auto', display:'flex', gap:8, marginBottom:16, paddingBottom:4 }}>
          {allPhases.map(p => {
            const isSelected = p.id === selectedPhase?.id
            const pColor = p.color ?? T.indigo
            return (
              <button key={p.id} onClick={() => switchPhase(p)}
                style={{ flexShrink:0, padding:'6px 12px', borderRadius:20, cursor:'pointer', border:`1px solid ${isSelected ? pColor : T.border}`,
                  background: isSelected ? `${pColor}25` : T.navy2, color: isSelected ? pColor : T.slate, fontSize:11, fontWeight: isSelected ? 700 : 400,
                  whiteSpace:'nowrap' }}>
                {p.is_active ? '● ' : ''}{p.phase_name} · M{p.month}
              </button>
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.slate }}>Phase Progress</span>
            <span style={{ fontSize:13, fontWeight:700, color:phaseColor }}>{pct}%</span>
          </div>
          <div style={{ height:8, background:T.navy3, borderRadius:4 }}>
            <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,${phaseColor},${T.indigoL})`, width:`${pct}%`, transition:'width 0.5s' }} />
          </div>
          <div style={{ marginTop:8, fontSize:11, color:T.slate }}>
            {selectedPhase?.badge ?? 'Explorer'} · Tap any task → read → mark complete
          </div>
        </div>

        {loadingPhase && (
          <div style={{ textAlign:'center', padding:'40px 0', color:T.slate }}>
            <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
            <div style={{ fontSize:13 }}>Loading tasks…</div>
          </div>
        )}

        {!loadingPhase && tasks.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 0', color:T.slate }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:16, color:T.white, marginBottom:6 }}>No tasks for this phase yet</div>
            <div style={{ fontSize:13 }}>Tasks are being seeded — check back soon.</div>
          </div>
        )}

        {!loadingPhase && weekday.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em' }}>📅 Mon–Fri · 30 min each</span>
              <span style={{ fontSize:11, color:T.slate }}>{weekday.filter(t=>completions[t.id]).length}/{weekday.length}</span>
            </div>
            {weekday.map(renderTask)}
          </div>
        )}

        {!loadingPhase && weekend.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em' }}>🌅 Sat–Sun · 45–60 min</span>
              <span style={{ fontSize:11, color:T.slate }}>{weekend.filter(t=>completions[t.id]).length}/{weekend.length}</span>
            </div>
            {weekend.map(renderTask)}
          </div>
        )}
      </div>
    </div>
  )
}
