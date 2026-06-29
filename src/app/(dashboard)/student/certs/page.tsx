import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CertsClient from './CertsClient'

export default async function CertsPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: certs } = await sb.from('certificates')
    .select('*').eq('student_id', user.id).order('display_order')

  return <CertsClient userId={user.id} initialCerts={certs ?? []} />
}
