import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CurriculumClient from './CurriculumClient'

export default async function CurriculumPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  // All phases with task counts
  const { data: phases } = await sb.from('phases')
    .select('*')
    .order('year').order('month')

  // All tasks
  const { data: tasks } = await sb.from('tasks')
    .select('*')
    .order('task_order')

  // All completions for this student
  const { data: completions } = await sb.from('task_completions')
    .select('task_id, parent_approved')
    .eq('student_id', user.id)

  return (
    <CurriculumClient
      userId={user.id}
      phases={phases ?? []}
      tasks={tasks ?? []}
      completions={completions ?? []}
    />
  )
}
