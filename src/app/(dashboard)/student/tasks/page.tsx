'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TasksClient from './TasksClient'

const T = { bg:'#0A0F1E', navy2:'#0F1629', border:'#1E2A47', slate:'#94A3B8', white:'#F8FAFC', emerald:'#10B981', red:'#EF4444', amber:'#E8A838' }

export default function TasksPage() {
  const [status, setStatus]       = useState('Initialising…')
  const [debug, setDebug]         = useState<string[]>([])
  const [ready, setReady]         = useState(false)
  const [userId, setUserId]       = useState('')
  const [activePhase, setPhase]   = useState<any>(null)
  const [allPhases, setAllPhases] = useState<any[]>([])
  const [tasks, setTasks]         = useState<any[]>([])
  const [completions, setComps]   = useState<any[]>([])

  const log = (msg: string) => {
    console.log('[Tasks]', msg)
    setDebug(prev => [...prev, msg])
  }

  useEffect(() => {
    const sb = createClient()
    const load = async () => {
      log('createClient() called')
      setStatus('Checking session…')

      const { data: { user }, error: authErr } = await sb.auth.getUser()
      log(`getUser() → user: ${user?.id ?? 'NULL'}, error: ${authErr?.message ?? 'none'}`)

      if (!user) {
        setStatus('No session — redirecting to login')
        setTimeout(() => { window.location.href = '/login' }, 2000)
        return
      }

      setUserId(user.id)
      setStatus('Session OK. Fetching phases…')

      const { data: phases, error: pErr } = await sb.from('phases').select('*').eq('is_active', true).order('year').order('month').limit(1)
      log(`phases query → count: ${phases?.length ?? 0}, error: ${pErr?.message ?? 'none'}`)

      const { data: all, error: allErr } = await sb.from('phases').select('id, phase_name, label, year, month, color, badge, is_active, phase_number').order('year').order('month')
      log(`all phases → count: ${all?.length ?? 0}, error: ${allErr?.message ?? 'none'}`)

      const { data: comps } = await sb.from('task_completions').select('*').eq('student_id', user.id)

      const phase = phases?.[0] ?? null
      setPhase(phase)
      setAllPhases(all ?? [])
      setComps(comps ?? [])

      if (phase) {
        setStatus('Fetching tasks…')
        const { data: t, error: tErr } = await sb.from('tasks').select('*').eq('phase_id', phase.id).order('task_order')
        log(`tasks query → count: ${t?.length ?? 0}, error: ${tErr?.message ?? 'none'}`)
        setTasks(t ?? [])
      } else {
        log('No active phase found — tasks will be empty')
      }

      setStatus('Done')
      setReady(true)
    }
    load()
  }, [])

  // Show debug panel until ready
  if (!ready) return (
    <div style={{ padding:16, fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh' }}>
      <div style={{ fontSize:16, fontWeight:700, color:T.white, marginBottom:8 }}>🔍 Debug Mode</div>
      <div style={{ fontSize:13, color:T.amber, marginBottom:16 }}>{status}</div>
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:10, padding:12 }}>
        {debug.length === 0 ? (
          <div style={{ fontSize:12, color:T.slate }}>Starting…</div>
        ) : debug.map((d, i) => (
          <div key={i} style={{ fontSize:11, color: d.includes('NULL') || d.includes('error:') && !d.includes('none') ? T.red : T.emerald, marginBottom:4, fontFamily:'monospace' }}>
            {d}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <TasksClient
      userId={userId}
      activePhase={activePhase}
      allPhases={allPhases}
      initialTasks={tasks}
      initialCompletions={completions}
    />
  )
}
