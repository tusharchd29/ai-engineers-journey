'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TasksClient from './TasksClient'

export default function TasksPage() {
  const [ready, setReady]         = useState(false)
  const [userId, setUserId]       = useState('')
  const [activePhase, setPhase]   = useState<any>(null)
  const [allPhases, setAllPhases] = useState<any[]>([])
  const [tasks, setTasks]         = useState<any[]>([])
  const [completions, setComps]   = useState<any[]>([])

  useEffect(() => {
    const sb = createClient()
    const load = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      const [{ data: phases }, { data: comps }, { data: all }] = await Promise.all([
        sb.from('phases').select('*').eq('is_active', true).order('year').order('month').limit(1),
        sb.from('task_completions').select('*').eq('student_id', user.id),
        sb.from('phases').select('id, phase_name, label, year, month, color, badge, is_active, phase_number').order('year').order('month'),
      ])

      const phase = phases?.[0] ?? null
      setPhase(phase)
      setAllPhases(all ?? [])
      setComps(comps ?? [])

      if (phase) {
        const { data: t } = await sb.from('tasks').select('*').eq('phase_id', phase.id).order('task_order')
        setTasks(t ?? [])
      }
      setReady(true)
    }
    load()
  }, [])

  if (!ready) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'#94A3B8', fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:14 }}>Loading tasks…</div>
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
