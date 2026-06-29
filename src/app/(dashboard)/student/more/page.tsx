'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', border:'#1E2A47', indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

const LINKS = [
  { href:'/student/roadmap',  label:'Roadmap',     sub:'All 12 phases of your journey',   emoji:'🗺️',  color:'#6C63FF' },
  { href:'/student/certs',    label:'Certificates', sub:'Track earned certificates',        emoji:'🏅',  color:'#E8A838' },
  { href:'/student/energy',   label:'Energy Log',   sub:'Daily energy and burnout tracker', emoji:'💚',  color:'#10B981' },
  { href:'/student/profile',  label:'My Profile',   sub:'Edit bio, goals, and links',       emoji:'👤',  color:'#8B85FF' },
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
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>More</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>All sections of your journey</div>
      </div>

      {LINKS.map(l => (
        <Link key={l.href} href={l.href} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, marginBottom:10, textDecoration:'none' }}>
          <div style={{ width:44, height:44, borderRadius:12, background:`${l.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{l.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600, color:T.white }}>{l.label}</div>
            <div style={{ fontSize:12, color:T.slate, marginTop:2 }}>{l.sub}</div>
          </div>
          <span style={{ color:T.slate, fontSize:16 }}>›</span>
        </Link>
      ))}

      <button onClick={handleSignOut}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, marginTop:8, cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'#EF444415', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🚪</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:'#EF4444' }}>Sign Out</div>
          <div style={{ fontSize:12, color:T.slate, marginTop:2 }}>See you next session</div>
        </div>
      </button>
    </div>
  )
}
