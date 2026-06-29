'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CurriculumClient from './CurriculumClient'

export default function CurriculumPage() {
  const [ready, setReady]           = useState(false)
  const [userId, setUserId]         = useState('')
  const [phases, setPhases]         = useState<any[]>([])
  const [tasks, setTasks]           = useState<any[]>([])
  const [completions, setCompletions] = useState<any[]>([])

  useEffect(() => {
    const sb = createClient()
    const load = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      const [{ data: p }, { data: t }, { data: c }] = await Promise.all([
        sb.from('phases').select('*').order('year').order('month'),
        sb.from('tasks').select('*').order('task_order'),
        sb.from('task_completions').select('task_id, parent_approved').eq('student_id', user.id),
      ])

      setPhases(p ?? [])
      setTasks(t ?? [])
      setCompletions(c ?? [])
      setReady(true)
    }
    load()
  }, [])

  if (!ready) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'#94A3B8', fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:14 }}>Loading curriculum…</div>
    </div>
  )

  return (
    <CurriculumClient
      userId={userId}
      phases={phases}
      tasks={tasks}
      completions={completions}
    />
  )
}
