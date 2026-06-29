import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  // Get active phase
  const { data: phases } = await sb.from('phases').select('*').eq('is_active', true).limit(1)
  const phase = phases?.[0] ?? null

  // Get tasks for that phase
  const { data: tasks } = phase
    ? await sb.from('tasks').select('*').eq('phase_id', phase.id).order('task_order')
    : { data: [] }

  // Get existing completions
  const { data: completions } = await sb.from('task_completions').select('*').eq('student_id', user.id)

  return (
    <TasksClient
      userId={user.id}
      phase={phase}
      initialTasks={tasks ?? []}
      initialCompletions={completions ?? []}
    />
  )
}
