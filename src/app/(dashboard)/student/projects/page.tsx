import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsClient from './ProjectsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectsPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, { data: subs }] = await Promise.all([
    sb.from('projects').select('*').order('display_order'),
    sb.from('project_submissions').select('*').eq('student_id', user.id),
  ])

  const subMap: Record<string, any> = {}
  for (const s of subs ?? []) subMap[s.project_id] = s

  return <ProjectsClient userId={user.id} initialProjects={projects ?? []} initialSubs={subMap} />
}
