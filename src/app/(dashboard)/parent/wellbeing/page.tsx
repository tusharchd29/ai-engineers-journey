import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
export default async function Page() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div style={{ padding:40, color:'#94A3B8', fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:22, fontWeight:700, color:'#F8FAFC', fontFamily:'"Space Grotesk",sans-serif', marginBottom:8, textTransform:'capitalize' }}>wellbeing</div>
      <div>Full wellbeing view — coming in next iteration.</div>
    </div>
  )
}
