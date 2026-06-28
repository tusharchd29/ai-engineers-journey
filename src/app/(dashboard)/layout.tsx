import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#0A0F1E', fontFamily:'Inter,sans-serif' }}>
      {/* Top bar */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:'#0F1629',
        borderBottom:'1px solid #1E2A47',
        padding:'12px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#6C63FF', letterSpacing:'0.08em', fontFamily:'"Space Grotesk",sans-serif' }}>
            AI ENGINEER&apos;S JOURNEY
          </div>
          <div style={{ fontSize:11, color:'#94A3B8', marginTop:1 }}>
            {profile?.name?.split(' ')[0] ?? '…'} · {profile?.role === 'parent' ? 'Mentor' : 'Class 9'}
          </div>
        </div>
        <div style={{ fontSize:22 }}>
          {profile?.role === 'parent' ? '👨‍💻' : '🎓'}
        </div>
      </div>

      {/* Page content */}
      <main style={{ flex:1, overflowY:'auto', paddingBottom:72 }}>
        {children}
      </main>

      {/* Bottom nav */}
      <BottomNav role={profile?.role ?? 'student'} />
    </div>
  )
}
