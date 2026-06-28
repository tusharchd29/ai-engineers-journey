'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default function TasksPage() {
  const [tasks, setTasks]       = useState<any[]>([])
  const [done,  setDone]        = useState<Set<string>>(new Set())
  const [userId, setUserId]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [phase, setPhase]       = useState<any>(null)
  const sb = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: phases } = await sb.from('phases').select('*').order('year').order('month').limit(1)
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

  const toggle = async (taskId: string) => {
    if (!userId) return
    if (done.has(taskId)) {
      await sb.from('task_completions').delete().eq('task_id', taskId).eq('student_id', userId)
      setDone(prev => { const n = new Set(prev); n.delete(taskId); return n })
    } else {
      await sb.from('task_completions').upsert({ task_id: taskId, student_id: userId, parent_approved: false }, { onConflict: 'task_id,student_id' })
      setDone(prev => { const n = new Set(prev); n.add(taskId); return n })
    }
  }

  if (loading) return <div style={{ padding:40, color:T.slate }}>Loading tasks…</div>

  const weekday = tasks.filter(t => t.task_type === 'weekday')
  const weekend = tasks.filter(t => t.task_type === 'weekend')
  const pct = tasks.length ? Math.round((done.size / tasks.length) * 100) : 0

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>My Tasks</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{phase?.label} · {done.size} of {tasks.length} complete</div>
      </div>

      {/* Progress bar */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Phase Progress</span>
          <span style={{ fontSize:13, fontWeight:600, color:T.indigo }}>{pct}%</span>
        </div>
        <div style={{ height:8, background:T.navy3, borderRadius:4 }}>
          <div style={{ height:'100%', background:`linear-gradient(90deg,${T.indigo},${T.indigoL})`, borderRadius:4, width:`${pct}%`, transition:'width 0.4s' }} />
        </div>
        <div style={{ marginTop:10, fontSize:11, color:T.slate }}>
          Max 4.5 hrs/week · School always first · {tasks.filter(t=>t.task_type==='weekday').length} weekday × 30min + {tasks.filter(t=>t.task_type==='weekend').length} weekend tasks
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Weekday */}
        <div>
          <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
            Weekday (30 min each) · {weekday.filter(t=>done.has(t.id)).length}/{weekday.length}
          </div>
          {weekday.map(task => {
            const isDone = done.has(task.id)
            return (
              <div key={task.id} onClick={() => toggle(task.id)} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:8,
                background: isDone ? `${T.emerald}10` : T.navy2,
                border:`1px solid ${isDone ? T.emerald+'30' : T.border}`,
                borderRadius:10, cursor:'pointer', transition:'all 0.2s',
              }}>
                <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, background: isDone ? T.emerald : 'transparent', border:`2px solid ${isDone ? T.emerald : T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isDone && <span style={{ fontSize:11, color:'#fff', lineHeight:1 }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color: isDone ? T.slate : T.white, textDecoration: isDone ? 'line-through' : 'none', fontWeight:500 }}>{task.title}</div>
                  <div style={{ fontSize:10, color:T.slate, marginTop:2 }}>{task.time_estimate}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Weekend */}
        <div>
          <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
            Weekend (45–60 min) · {weekend.filter(t=>done.has(t.id)).length}/{weekend.length}
          </div>
          {weekend.map(task => {
            const isDone = done.has(task.id)
            return (
              <div key={task.id} onClick={() => toggle(task.id)} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:8,
                background: isDone ? `${T.emerald}10` : T.navy2,
                border:`1px solid ${isDone ? T.emerald+'30' : T.border}`,
                borderRadius:10, cursor:'pointer', transition:'all 0.2s',
              }}>
                <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, background: isDone ? T.emerald : 'transparent', border:`2px solid ${isDone ? T.emerald : T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isDone && <span style={{ fontSize:11, color:'#fff', lineHeight:1 }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color: isDone ? T.slate : T.white, textDecoration: isDone ? 'line-through' : 'none', fontWeight:500 }}>{task.title}</div>
                  <div style={{ fontSize:10, color:T.slate, marginTop:2 }}>{task.time_estimate}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
