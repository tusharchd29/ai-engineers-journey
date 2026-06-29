'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const T = { surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0', purple:'#7C6FE0', muted:'#8B82B8', text:'#2D2352', peach:'#F59E6C', mint:'#5EC990', sky:'#64BFDF' }

const LINKS = [
  { href:'/student/roadmap',  label:'Roadmap',      sub:'All 12 phases of your journey',   emoji:'🗺️',  color:'#7C6FE0', bg:'#F5F0FF' },
  { href:'/student/certs',    label:'Certificates', sub:'Track earned certificates',        emoji:'🏅',  color:'#F59E6C', bg:'#FFF3EA' },
  { href:'/student/energy',   label:'Energy Log',   sub:'Daily energy and burnout tracker', emoji:'💚',  color:'#5EC990', bg:'#EDFBF4' },
  { href:'/student/profile',  label:'My Profile',   sub:'Edit bio, goals, and links',       emoji:'👤',  color:'#64BFDF', bg:'#EAF6FD' },
]

export default function MorePage() {
  const router = useRouter()
  const handleSignOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>More</div>
        <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>All sections of your journey</div>
      </div>

      {LINKS.map(l => (
        <Link key={l.href} href={l.href} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:10, textDecoration:'none', boxShadow:'0 1px 6px rgba(124,111,224,0.04)' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:l.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{l.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600, color:T.text }}>{l.label}</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{l.sub}</div>
          </div>
          <span style={{ color:T.muted, fontSize:16 }}>›</span>
        </Link>
      ))}

      <button onClick={handleSignOut}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, marginTop:8, cursor:'pointer', textAlign:'left', boxShadow:'0 1px 6px rgba(124,111,224,0.04)' }}>
        <div style={{ width:48, height:48, borderRadius:14, background:'#FFF0F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🚪</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:'#F27171' }}>Sign Out</div>
          <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>See you next session</div>
        </div>
      </button>
    </div>
  )
}
