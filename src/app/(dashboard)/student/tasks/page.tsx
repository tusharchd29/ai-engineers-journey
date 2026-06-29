'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default function TasksPage() {
  const [tasks, setTasks]       = useState<any[]>([])
  const [done,  setDone]        = useState<Set<string>>(new Set())
  const [userId, setUserId]     = useState<string|null>(null)
  const [loading, setLoading]   = useState(true)
  const [phase, setPhase]       = useState<any>(null)
  const [proving, setProving]   = useState<string|null>(null)   // task id being proved
  const [proofText, setProofText] = useState('')
  const [githubHash, setGithubHash] = useState('')
  const [saving, setSaving]     = useState(false)
  const sb = createClient()

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
        sb.from('task_completions').select('task_id').eq('student_id', user.id),
      ])
      setTasks(t ?? [])
      setDone(new Set((c ?? []).map((x: any) => x.task_id)))
      setLoading(false)
    }
    load()
  }, [])

  const submitProof = async () => {
    if (!userId || !proving) return
    setSaving(true)
    await sb.from('task_completions').upsert({
      task_id: proving,
      student_id: userId,
      parent_approved: false,
      proof_text: proofText || null,
      github_hash: githubHash || null,
    }, { onConflict: 'task_id,student_id' })
    setDone(prev => { const n = new Set(prev); n.add(proving); return n })
    setProving(null); setProofText(''); setGithubHash(''); setSaving(false)
  }

  const untick = async (taskId: string) => {
    if (!userId) return
    await sb.from('task_completions').delete().eq('task_id', taskId).eq('student_id', userId)
    setDone(prev => { const n = new Set(prev); n.delete(taskId); return n })
  }

  if (loading) return <div style={{ padding:32, color:T.slate, textAlign:'center' }}>Loading tasks…</div>

  const weekday = tasks.filter(t => t.task_type === 'weekday')
  const weekend = tasks.filter(t => t.task_type === 'weekend')
  const pct = tasks.length ? Math.round((done.size / tasks.length) * 100) : 0

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>My Tasks</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{phase?.label ?? 'Phase 1'} · {done.size} of {tasks.length} done</div>
      </div>

      {/* Progress */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Phase Progress</span>
          <span style={{ fontSize:13, fontWeight:700, color:T.indigo }}>{pct}%</span>
        </div>
        <div style={{ height:8, background:T.navy3, borderRadius:4 }}>
          <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,${T.indigo},${T.indigoL})`, width:`${pct}%`, transition:'width 0.4s' }} />
        </div>
        <div style={{ marginTop:8, fontSize:11, color:T.slate }}>Tap a task to mark complete · Add proof so Tushar can approve</div>
      </div>

      {/* Proof modal */}
      {proving && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
          <div style={{ width:'100%', background:T.navy2, borderRadius:'20px 20px 0 0', padding:24 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.white, marginBottom:4 }}>
              ✓ Mark as Done
            </div>
            <div style={{ fontSize:12, color:T.slate, marginBottom:16 }}>
              {tasks.find(t => t.id === proving)?.title}
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>What did you do? (optional but helps Tushar approve)</label>
              <textarea
                value={proofText}
                onChange={e => setProofText(e.target.value)}
                placeholder="e.g. Completed CS50 Week 1 — watched lecture, did Mario problem set"
                rows={3}
                style={{ width:'100%', padding:'10px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:10, color:T.white, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif' }}
              />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:6 }}>GitHub commit / link (optional)</label>
              <input
                value={githubHash}
                onChange={e => setGithubHash(e.target.value)}
                placeholder="e.g. github.com/rishona/cs50/commit/abc123"
                style={{ width:'100%', padding:'10px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:10, color:T.white, fontSize:13, boxSizing:'border-box' }}
              />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setProving(null); setProofText(''); setGithubHash('') }}
                style={{ flex:1, padding:12, background:'transparent', border:`1px solid ${T.border}`, borderRadius:10, color:T.slate, fontSize:14, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={submitProof} disabled={saving}
                style={{ flex:2, padding:12, background:T.emerald, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
                {saving ? 'Saving…' : '✓ Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekday tasks */}
      {weekday.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, display:'flex', justifyContent:'space-between' }}>
            <span>Mon–Fri · 30 min each</span>
            <span>{weekday.filter(t=>done.has(t.id)).length}/{weekday.length}</span>
          </div>
          {weekday.map(task => {
            const isDone = done.has(task.id)
            return (
              <div key={task.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'14px 16px', marginBottom:8,
                background: isDone ? `${T.emerald}10` : T.navy2,
                border:`1px solid ${isDone ? T.emerald+'40' : T.border}`,
                borderRadius:12, cursor:'pointer',
              }}
                onClick={() => isDone ? untick(task.id) : setProving(task.id)}
              >
                <div style={{ width:24, height:24, borderRadius:7, flexShrink:0, background: isDone ? T.emerald : 'transparent', border:`2px solid ${isDone ? T.emerald : T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isDone && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color: isDone ? T.slate : T.white, textDecoration: isDone ? 'line-through' : 'none', fontWeight:500 }}>{task.title}</div>
                  <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{task.time_estimate}</div>
                </div>
                {!isDone && <div style={{ fontSize:11, color:T.slate }}>Tap</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Weekend tasks */}
      {weekend.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, display:'flex', justifyContent:'space-between' }}>
            <span>Sat–Sun · 45–60 min</span>
            <span>{weekend.filter(t=>done.has(t.id)).length}/{weekend.length}</span>
          </div>
          {weekend.map(task => {
            const isDone = done.has(task.id)
            return (
              <div key={task.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'14px 16px', marginBottom:8,
                background: isDone ? `${T.emerald}10` : T.navy2,
                border:`1px solid ${isDone ? T.emerald+'40' : T.border}`,
                borderRadius:12, cursor:'pointer',
              }}
                onClick={() => isDone ? untick(task.id) : setProving(task.id)}
              >
                <div style={{ width:24, height:24, borderRadius:7, flexShrink:0, background: isDone ? T.emerald : 'transparent', border:`2px solid ${isDone ? T.emerald : T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isDone && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color: isDone ? T.slate : T.white, textDecoration: isDone ? 'line-through' : 'none', fontWeight:500 }}>{task.title}</div>
                  <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{task.time_estimate}</div>
                </div>
                {!isDone && <div style={{ fontSize:11, color:T.slate }}>Tap</div>}
              </div>
            )
          })}
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0', color:T.slate }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:14 }}>No tasks for this phase yet.</div>
        </div>
      )}
    </div>
  )
}
