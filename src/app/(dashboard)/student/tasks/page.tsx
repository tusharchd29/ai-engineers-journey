import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  // Fetch active phase
  const { data: phases } = await sb.from('phases')
    .select('*')
    .eq('is_active', true)
    .order('year').order('month')
    .limit(1)

  const phase = phases?.[0] ?? null

  // Fetch tasks for active phase
  const { data: tasks } = phase
    ? await sb.from('tasks').select('*').eq('phase_id', phase.id).order('task_order')
    : { data: [] }

  // Fetch ALL phases for the phase switcher
  const { data: allPhases } = await sb.from('phases')
    .select('id, phase_name, label, year, month, color, badge, is_active, phase_number')
    .order('year').order('month')

  // Fetch completions for this student
  const { data: completions } = await sb.from('task_completions')
    .select('*').eq('student_id', user.id)

  return (
    <TasksClient
      userId={user.id}
      activePhase={phase}
      allPhases={allPhases ?? []}
      initialTasks={tasks ?? []}
      initialCompletions={completions ?? []}
    />
  )
}
