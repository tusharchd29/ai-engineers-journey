'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { bg:'#0A0F1E', navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981', red:'#EF4444' }

interface Task { id:string; title:string; description:string|null; task_type:string; time_estimate:string; task_order:number; resource_url:string|null; requires_proof:boolean }
interface Completion { task_id:string; proof_text:string|null; proof_url:string|null; proof_file_path:string|null; github_hash:string|null; parent_approved:boolean; parent_notes:string|null }

export default function TasksPage() {
  const [tasks, setTasks]         = useState<Task[]>([])
  const [completions, setComps]   = useState<Record<string,Completion>>({})
  const [userId, setUserId]       = useState<string|null>(null)
  const [loading, setLoading]     = useState(true)
  const [phase, setPhase]         = useState<any>(null)
  const [view, setView]           = useState<'list'|'detail'|'proof'>('list')
  const [activeTask, setActive]   = useState<Task|null>(null)
  const [proofText, setProofText] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [file, setFile]           = useState<File|null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sb = createClient()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: phases } = await sb.from('phases').select('*').eq('is_active', true).limit(1)
      const p = phases?.[0]
      setPhase(p)
      if (!p) { setLoading(false); return }
      const [{ data: t }, { data: c }] = await Promise.all([
        sb.from('tasks').select('*').eq('phase_id', p.id).order('task_order'),
        sb.from('task_completions').select('*').eq('student_id', user.id),
      ])
      setTasks((t ?? []) as Task[])
      const map: Record<string,Completion> = {}
      for (const comp of c ?? []) map[comp.task_id] = comp
      setComps(map)
      setLoading(false)
    }
    load()
  }, [])

  const openDetail = (task: Task) => { setActive(task); setView('detail') }
  
  const openProof = (task: Task) => {
    const existing = completions[task.id]
    setProofText(existing?.proof_text ?? '')
    setGithubLink(existing?.github_hash ?? '')
    setFile(null)
    setActive(task)
    setView('proof')
  }

  const markComplete = async () => {
    if (!userId || !activeTask) return
    setSaving(true)
    let fileUrl: string|null = null
    let filePath: string|null = null

    if (file) {
      setUploading(true)
      const ext = file.name.split('.').pop()
      const path = `${userId}/tasks/${activeTask.id}-proof-${Date.now()}.${ext}`
      const { data: up, error } = await sb.storage.from('ai-journey').upload(path, file, { upsert: true })
      if (!error && up) {
        filePath = up.path
        const { data: url } = sb.storage.from('ai-journey').getPublicUrl(up.path)
        fileUrl = url.publicUrl
      }
      setUploading(false)
    }

    const { data } = await sb.from('task_completions').upsert({
      task_id: activeTask.id,
      student_id: userId,
      proof_text: proofText || null,
      github_hash: githubLink || null,
      proof_url: fileUrl,
      proof_file_path: filePath,
      proof_type: file ? 'file' : githubLink ? 'github' : proofText ? 'text' : 'self',
      parent_approved: false,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'task_id,student_id' }).select().single()

    if (data) setComps(prev => ({ ...prev, [activeTask.id]: data }))
    setSaving(false)
    showToast('✓ Task marked complete!')
    setView('list')
  }

  const untick = async (taskId: string) => {
    if (!userId) return
    await sb.from('task_completions').delete().eq('task_id', taskId).eq('student_id', userId)
    setComps(prev => { const n = {...prev}; delete n[taskId]; return n })
    showToast('Task unchecked')
  }

  const done = Object.keys(completions)
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
  const weekday = tasks.filter(t => t.task_type === 'weekday')
  const weekend = tasks.filter(t => t.task_type === 'weekend')

  if (loading) return <div style={{ padding:40, textAlign:'center', color:T.slate, fontFamily:'Inter,sans-serif' }}>Loading tasks…</div>

  // ── PROOF SHEET ──────────────────────────────────────────────────────────
  if (view === 'proof' && activeTask) return (
    <div style={{ fontFamily:'Inter,sans-serif', minHeight:'100vh', background:T.bg }}>
      {/* Header */}
      <div style={{ padding:'16px 16px 0' }}>
        <button onClick={() => setView('detail')} style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← Back</button>
        <div style={{ fontSize:18, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', marginBottom:4 }}>Mark as Complete</div>
        <div style={{ fontSize:13, color:T.slate, marginBottom:20 }}>{activeTask.title}</div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* Upload file */}
        <div style={{ background:T.navy2, border:`2px dashed ${file ? T.emerald : T.border}`, borderRadius:14, padding:20, marginBottom:12, textAlign:'center', cursor:'pointer' }}
          onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*,.pdf,video/*" style={{ display:'none' }}
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <div>
              <div style={{ fontSize:24, marginBottom:6 }}>📎</div>
              <div style={{ fontSize:13, color:T.emerald, fontWeight:600 }}>{file.name}</div>
              <div style={{ fontSize:11, color:T.slate, marginTop:3 }}>{(file.size/1024/1024).toFixed(1)} MB</div>
              <button onClick={e => { e.stopPropagation(); setFile(null) }}
                style={{ marginTop:8, fontSize:11, color:T.red, background:'none', border:'none', cursor:'pointer' }}>Remove</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
              <div style={{ fontSize:14, color:T.white, fontWeight:600, marginBottom:4 }}>Upload proof</div>
              <div style={{ fontSize:12, color:T.slate }}>Screenshot · PDF · Photo · Video</div>
              <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>Tap to choose file</div>
            </div>
          )}
        </div>

        {/* OR divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ flex:1, height:1, background:T.border }} />
          <span style={{ fontSize:11, color:T.slate }}>or add details</span>
          <div style={{ flex:1, height:1, background:T.border }} />
        </div>

        {/* GitHub link */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>GitHub / Link (optional)</label>
          <input value={githubLink} onChange={e => setGithubLink(e.target.value)}
            placeholder="https://github.com/rishona/project or commit URL"
            style={{ width:'100%', padding:'11px 14px', background:T.navy2, border:`1px solid ${githubLink ? T.indigo : T.border}`, borderRadius:10, color:T.white, fontSize:13, boxSizing:'border-box' }} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>What did you do? (optional)</label>
          <textarea value={proofText} onChange={e => setProofText(e.target.value)}
            placeholder={`e.g. Watched ${activeTask.title} — took notes, completed exercises, pushed to GitHub`}
            rows={4}
            style={{ width:'100%', padding:'11px 14px', background:T.navy2, border:`1px solid ${proofText ? T.indigo : T.border}`, borderRadius:10, color:T.white, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', lineHeight:1.6 }} />
        </div>

        {uploading && (
          <div style={{ marginBottom:12, padding:'10px 14px', background:`${T.indigo}15`, border:`1px solid ${T.indigo}30`, borderRadius:10 }}>
            <div style={{ fontSize:12, color:T.indigoL, marginBottom:6 }}>Uploading file…</div>
            <div style={{ height:4, background:T.navy3, borderRadius:2 }}>
              <div style={{ height:'100%', background:T.indigo, borderRadius:2, width:`${uploadProgress}%`, transition:'width 0.3s' }} />
            </div>
          </div>
        )}

        <button onClick={markComplete} disabled={saving || uploading}
          style={{ width:'100%', padding:15, background: saving ? T.navy3 : T.emerald, border:'none', borderRadius:12, color: saving ? T.slate : '#fff', fontSize:15, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : '✓ Mark Complete'}
        </button>

        <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:T.slate }}>
          Proof is optional — Tushar will see everything you add
        </div>
      </div>
    </div>
  )

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === 'detail' && activeTask) {
    const comp = completions[activeTask.id]
    const isDone = !!comp

    return (
      <div style={{ fontFamily:'Inter,sans-serif', minHeight:'100vh', background:T.bg }}>
        <div style={{ padding:'16px 16px 0' }}>
          <button onClick={() => setView('list')} style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:16 }}>← Tasks</button>
        </div>

        {/* Task header */}
        <div style={{ padding:'0 16px', marginBottom:16 }}>
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:`${T.indigo}20`, color:T.indigoL }}>
              {activeTask.task_type === 'weekday' ? 'Mon–Fri' : 'Sat–Sun'}
            </span>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:T.navy2, color:T.slate, border:`1px solid ${T.border}` }}>
              {activeTask.time_estimate}
            </span>
            {isDone && (
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:`${T.emerald}20`, color:T.emerald }}>
                ✓ Done
              </span>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1.3, marginBottom:8 }}>
            {activeTask.title}
          </div>
        </div>

        {/* Description */}
        {activeTask.description && (
          <div style={{ margin:'0 16px 12px', padding:16, background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14 }}>
            <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>What to do</div>
            <div style={{ fontSize:14, color:T.white, lineHeight:1.8 }}>{activeTask.description}</div>
          </div>
        )}

        {/* Resource link */}
        {activeTask.resource_url && (
          <div style={{ margin:'0 16px 12px' }}>
            <a href={activeTask.resource_url} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:`${T.indigo}10`, border:`1px solid ${T.indigo}30`, borderRadius:12, textDecoration:'none' }}>
              <span style={{ fontSize:24 }}>🔗</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.indigoL }}>Open Resource</div>
                <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{activeTask.resource_url.replace('https://','').split('/')[0]}</div>
              </div>
              <span style={{ marginLeft:'auto', color:T.slate }}>→</span>
            </a>
          </div>
        )}

        {/* Completion proof if done */}
        {isDone && (
          <div style={{ margin:'0 16px 12px', padding:16, background:`${T.emerald}08`, border:`1px solid ${T.emerald}25`, borderRadius:14 }}>
            <div style={{ fontSize:11, color:T.emerald, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
              Your Proof · {comp.parent_approved ? '✓ Approved by Tushar' : 'Waiting for approval'}
            </div>
            {comp.proof_text && <div style={{ fontSize:13, color:T.white, lineHeight:1.6, marginBottom:8 }}>{comp.proof_text}</div>}
            {comp.github_hash && (
              <a href={comp.github_hash.startsWith('http') ? comp.github_hash : `https://${comp.github_hash}`}
                target="_blank" rel="noreferrer"
                style={{ display:'block', fontSize:12, color:T.indigo, marginBottom:6, textDecoration:'none' }}>
                🐙 {comp.github_hash}
              </a>
            )}
            {comp.proof_url && (
              <a href={comp.proof_url} target="_blank" rel="noreferrer"
                style={{ display:'block', fontSize:12, color:T.amber, textDecoration:'none' }}>
                📎 View uploaded file
              </a>
            )}
            {comp.parent_notes && (
              <div style={{ marginTop:10, padding:'10px 12px', background:T.navy2, borderRadius:8, fontSize:12, color:T.slate, lineHeight:1.5 }}>
                <strong style={{ color:T.amber }}>Tushar&apos;s note:</strong> {comp.parent_notes}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10, marginTop:4 }}>
          {!isDone ? (
            <button onClick={() => openProof(activeTask)}
              style={{ width:'100%', padding:15, background:T.emerald, border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              ✓ Mark as Complete
            </button>
          ) : (
            <>
              <button onClick={() => openProof(activeTask)}
                style={{ width:'100%', padding:13, background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, color:T.slate, fontSize:14, cursor:'pointer' }}>
                Edit Proof
              </button>
              <button onClick={() => { untick(activeTask.id); setView('list') }}
                style={{ width:'100%', padding:13, background:'transparent', border:`1px solid ${T.red}40`, borderRadius:12, color:T.red, fontSize:14, cursor:'pointer' }}>
                Unmark Complete
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  const renderTask = (task: Task) => {
    const isDone = !!completions[task.id]
    const comp = completions[task.id]
    const approved = comp?.parent_approved
    return (
      <div key={task.id} onClick={() => openDetail(task)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', marginBottom:8,
          background: isDone ? `${T.emerald}08` : T.navy2,
          border:`1px solid ${approved ? T.amber+'60' : isDone ? T.emerald+'30' : T.border}`,
          borderRadius:12, cursor:'pointer' }}>
        {/* Checkbox */}
        <div style={{ width:26, height:26, borderRadius:8, flexShrink:0,
          background: isDone ? T.emerald : 'transparent',
          border:`2px solid ${isDone ? T.emerald : T.border}`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {isDone && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
        </div>
        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, color: isDone ? T.slate : T.white, fontWeight:500,
            textDecoration: isDone ? 'line-through' : 'none',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {task.title}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center' }}>
            <span style={{ fontSize:11, color:T.slate }}>{task.time_estimate}</span>
            {comp?.proof_url && <span style={{ fontSize:10, color:T.amber }}>📎 file</span>}
            {comp?.github_hash && <span style={{ fontSize:10, color:T.indigo }}>🐙 github</span>}
            {approved && <span style={{ fontSize:10, color:T.amber, fontWeight:600 }}>✓ approved</span>}
          </div>
        </div>
        <span style={{ color:T.slate, fontSize:16, flexShrink:0 }}>›</span>
      </div>
    )
  }

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:200,
          background:T.emerald, color:'#fff', padding:'10px 20px', borderRadius:30, fontSize:13, fontWeight:600, whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>My Tasks</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{phase?.label ?? 'Phase 1'} · {done.length} of {tasks.length} complete</div>
      </div>

      {/* Progress bar */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Phase Progress</span>
          <span style={{ fontSize:13, fontWeight:700, color:T.indigo }}>{pct}%</span>
        </div>
        <div style={{ height:8, background:T.navy3, borderRadius:4 }}>
          <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,${T.indigo},${T.indigoL})`, width:`${pct}%`, transition:'width 0.5s' }} />
        </div>
        <div style={{ marginTop:8, fontSize:11, color:T.slate }}>Tap any task to see details · Upload proof for Tushar to approve</div>
      </div>

      {/* Weekday */}
      {weekday.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em' }}>Mon–Fri · 30 min</span>
            <span style={{ fontSize:11, color:T.slate }}>{weekday.filter(t=>completions[t.id]).length}/{weekday.length}</span>
          </div>
          {weekday.map(renderTask)}
        </div>
      )}

      {/* Weekend */}
      {weekend.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em' }}>Sat–Sun · 45–60 min</span>
            <span style={{ fontSize:11, color:T.slate }}>{weekend.filter(t=>completions[t.id]).length}/{weekend.length}</span>
          </div>
          {weekend.map(renderTask)}
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{ textAlign:'center', padding:'50px 0', color:T.slate }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:15, color:T.white, marginBottom:6 }}>No tasks yet</div>
          <div style={{ fontSize:13 }}>This phase has no tasks loaded yet.</div>
        </div>
      )}
    </div>
  )
}
