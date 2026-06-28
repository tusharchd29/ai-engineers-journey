'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

interface Props {
  profile: { id: string; role: string; name: string; email: string } | null
  phases: { id: string; year: number; month: number; label: string; color: string; badge: string }[]
}

export default function Sidebar({ profile, phases }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const isParent = profile?.role === 'parent'

  const studentNav = [
    { href:'/student',          label:'Dashboard'   },
    { href:'/student/roadmap',  label:'Roadmap'     },
    { href:'/student/tasks',    label:'My Tasks'    },
    { href:'/student/certs',    label:'Certificates'},
    { href:'/student/energy',   label:'Energy Log'  },
  ]
  const parentNav = [
    { href:'/parent',           label:'Overview'    },
    { href:'/parent/approve',   label:'Approvals'   },
    { href:'/parent/progress',  label:'Progress'    },
    { href:'/parent/wellbeing', label:'Wellbeing'   },
  ]
  const nav = isParent ? parentNav : studentNav

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ width:220, flexShrink:0, background:T.navy2, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', height:'100vh' }}>
      {/* Logo */}
      <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.indigo, letterSpacing:'0.06em', fontFamily:'"Space Grotesk",sans-serif' }}>AI ENGINEER&apos;S</div>
        <div style={{ fontSize:11, color:T.slate }}>Journey · {isParent ? 'Mentor View' : 'Class 9'}</div>
      </div>

      {/* Role badge */}
      <div style={{ margin:'12px 12px 4px', padding:'8px 12px', background: isParent ? `${T.amber}15` : `${T.indigo}15`, border:`1px solid ${isParent ? T.amber+'30' : T.indigo+'30'}`, borderRadius:8 }}>
        <div style={{ fontSize:11, fontWeight:600, color: isParent ? T.amber : T.indigoL }}>{profile?.name ?? 'Loading…'}</div>
        <div style={{ fontSize:10, color:T.slate, marginTop:2 }}>{isParent ? 'Parent / Mentor' : 'Student · Explorer'}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 10px', overflow:'auto' }}>
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display:'block', padding:'9px 10px', borderRadius:8, marginBottom:2,
              background: active ? `${T.indigo}20` : 'transparent',
              color: active ? T.indigoL : T.slate,
              fontSize:13, fontWeight: active ? 600 : 400,
              textDecoration:'none', transition:'all 0.15s',
            }}>
              {item.label}
            </Link>
          )
        })}

        {/* Phase river — student only */}
        {!isParent && (
          <div style={{ marginTop:16, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, paddingLeft:10 }}>Phase River</div>
            {phases.slice(0, 8).map((p, i) => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: i === 0 ? p.color : T.border }} />
                <div style={{ fontSize:11, color: i === 0 ? T.white : T.slate, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Sign out */}
      <div style={{ padding:'12px 10px', borderTop:`1px solid ${T.border}` }}>
        <button onClick={handleSignOut} style={{
          width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`,
          background:'transparent', color:T.slate, fontSize:12, cursor:'pointer', textAlign:'left' as const,
        }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
