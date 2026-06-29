'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from './BottomNav'
import { useRouter } from 'next/navigation'

const T = { bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0', purple:'#7C6FE0', text:'#2D2352', muted:'#8B82B8', peach:'#F59E6C' }

export default function BottomNavWrapper({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    const load = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
    }
    load()
  }, [])

  return (
    <>
      {/* Top bar */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:T.surface,
        borderBottom:`1px solid ${T.border}`,
        padding:'12px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 1px 8px rgba(124,111,224,0.06)',
      }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.purple, letterSpacing:'0.08em', fontFamily:'"Space Grotesk",sans-serif' }}>
            AI ENGINEER&apos;S JOURNEY
          </div>
          <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>
            {profile?.name?.split(' ')[0] ?? '…'} · {profile?.role === 'parent' ? 'Mentor' : 'Class 9'}
          </div>
        </div>
        <div style={{ fontSize:22 }}>{profile?.role === 'parent' ? '👨‍💻' : '🎓'}</div>
      </div>

      <main style={{ flex:1, overflowY:'auto', paddingBottom:72 }}>
        {children}
      </main>

      <BottomNav role={profile?.role ?? 'student'} />
    </>
  )
}
