'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', border:'#1E2A47', indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838' }

const studentNav = [
  { href:'/student',            label:'Home',       icon:'⚡' },
  { href:'/student/tasks',      label:'Tasks',      icon:'✅' },
  { href:'/student/curriculum', label:'Curriculum', icon:'📚' },
  { href:'/student/projects',   label:'Projects',   icon:'🛠️' },
  { href:'/student/more',       label:'More',       icon:'⋯'  },
]

const parentNav = [
  { href:'/parent',           label:'Overview', icon:'📊' },
  { href:'/parent/approve',   label:'Approve',  icon:'✅' },
  { href:'/parent/progress',  label:'Progress', icon:'📈' },
  { href:'/parent/wellbeing', label:'Wellbeing',icon:'💚' },
]

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const isParent = role === 'parent'
  const nav      = isParent ? parentNav : studentNav
  const accent   = isParent ? T.amber : T.indigo

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      background:T.navy2, borderTop:`1px solid ${T.border}`,
      display:'flex',
      paddingBottom:'env(safe-area-inset-bottom, 0px)',
    }}>
      {nav.map(item => {
        const active = pathname.startsWith(item.href) && (item.href !== '/student' || pathname === '/student') && (item.href !== '/parent' || pathname === '/parent')
        return (
          <Link key={item.href} href={item.href} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            padding:'10px 4px 8px', textDecoration:'none',
            color: active ? accent : T.slate, position:'relative',
          }}>
            {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:24, height:2, background:accent, borderRadius:1 }} />}
            <span style={{ fontSize:item.icon==='⋯'?22:18, lineHeight:1, marginBottom:3 }}>{item.icon}</span>
            <span style={{ fontSize:9, fontWeight: active ? 700 : 400 }}>{item.label}</span>
          </Link>
        )
      })}
      {isParent && (
        <button onClick={handleSignOut} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 4px 8px', background:'transparent', border:'none', color:T.slate, cursor:'pointer' }}>
          <span style={{ fontSize:18, lineHeight:1, marginBottom:3 }}>🚪</span>
          <span style={{ fontSize:9 }}>Out</span>
        </button>
      )}
    </div>
  )
}
