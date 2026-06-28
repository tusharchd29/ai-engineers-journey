import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single()
  const { data: phases }  = await sb.from('phases').select('id,year,month,label,color,badge,phase_name').order('year').order('month')

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0A0F1E' }}>
      <Sidebar profile={profile} phases={phases ?? []} />
      <main style={{ flex:1, overflow:'auto' }}>{children}</main>
    </div>
  )
}
