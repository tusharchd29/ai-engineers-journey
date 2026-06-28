import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default async function StudentDashboard() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: phases }, { data: completions }, { data: energyLogs }, { data: burnoutFlags }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user.id).single(),
    sb.from('phases').select('*').order('year').order('month').limit(12),
    sb.from('task_completions').select('*').eq('student_id', user.id),
    sb.from('energy_logs').select('*').eq('student_id', user.id).order('log_date', { ascending: false }).limit(7),
    sb.from('burnout_flags').select('*').eq('student_id', user.id).eq('is_active', true),
  ])

  const currentPhase = phases?.[0]
  const { data: tasks } = await sb.from('tasks').select('*').eq('phase_id', currentPhase?.id ?? '').order('task_order')

  const completedIds = new Set((completions ?? []).map(c => c.task_id))
  const totalTasks = tasks?.length ?? 0
  const doneTasks  = (tasks ?? []).filter(t => completedIds.has(t.id)).length
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const avgEnergy = energyLogs?.length
    ? (energyLogs.reduce((s, l) => s + l.score, 0) / energyLogs.length).toFixed(1)
    : '—'

  const firstName = profile?.name?.split(' ')[0] ?? '…'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ padding:'16px 16px 8px' }}>

      {/* Greeting */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:24, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>
          {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          {currentPhase?.phase_name} · {currentPhase?.badge ?? 'Explorer'}
        </div>
      </div>

      {/* Burnout alert */}
      {(burnoutFlags?.length ?? 0) > 0 && (
        <div style={{ marginBottom:16, padding:'12px 14px', background:'#EF444415', border:'1px solid #EF444430', borderRadius:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#EF4444' }}>⚠ Check in with Tushar</div>
          <div style={{ fontSize:12, color:T.slate, marginTop:2 }}>Burnout flag active — take it easy today.</div>
        </div>
      )}

      {/* Stats row — 2×2 grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'Tasks Done',  value:`${doneTasks}/${totalTasks}`, sub:'this phase',  color:T.emerald },
          { label:'Progress',    value:`${pct}%`,                   sub:'phase',        color:T.indigo  },
          { label:'Energy Avg',  value:avgEnergy,                   sub:'this week',    color:T.amber   },
          { label:'Phase',       value:currentPhase?.badge ?? '—',  sub:'current rank', color:T.indigoL },
        ].map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Current Phase card */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Current Phase</div>
          <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${currentPhase?.color ?? T.indigo}20`, color:currentPhase?.color ?? T.indigo }}>
            {currentPhase?.badge ?? 'Explorer'}
          </div>
        </div>
        <div style={{ fontSize:15, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white, marginBottom:4, lineHeight:1.3 }}>
          {currentPhase?.label ?? 'Dev Setup & AI Onboarding'}
        </div>
        <div style={{ fontSize:12, color:T.slate, marginBottom:12 }}>{currentPhase?.focus}</div>
        {/* Progress bar */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:11, color:T.slate }}>Progress</span>
          <span style={{ fontSize:11, color:T.indigo, fontWeight:600 }}>{pct}%</span>
        </div>
        <div style={{ height:6, background:T.navy3, borderRadius:3 }}>
          <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${T.indigo},${T.indigoL})`, width:`${pct}%` }} />
        </div>
        <div style={{ marginTop:10, fontSize:11, color:T.slate }}>
          Mon–Fri {currentPhase?.weekday_time ?? '30 min'} · Sat–Sun {currentPhase?.weekend_time ?? '1.5 hrs'}
        </div>
      </div>

      {/* Tasks preview */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Tasks</div>
          <Link href="/student/tasks" style={{ fontSize:12, color:T.indigo, textDecoration:'none' }}>See all →</Link>
        </div>
        {(tasks ?? []).length === 0 ? (
          <div style={{ fontSize:12, color:T.slate }}>No tasks for this phase yet.</div>
        ) : (tasks ?? []).slice(0, 4).map(task => {
          const done = completedIds.has(task.id)
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, background: done ? T.emerald : 'transparent', border:`2px solid ${done ? T.emerald : T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done && <span style={{ fontSize:11, color:'#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize:13, color: done ? T.slate : T.white, textDecoration: done ? 'line-through' : 'none', flex:1 }}>
                {task.title}
              </span>
              <span style={{ fontSize:10, color:T.slate, whiteSpace:'nowrap' }}>{task.time_estimate}</span>
            </div>
          )
        })}
        {(tasks?.length ?? 0) > 4 && (
          <Link href="/student/tasks" style={{ display:'block', marginTop:4, fontSize:12, color:T.indigo, textDecoration:'none' }}>
            +{(tasks?.length ?? 0) - 4} more tasks
          </Link>
        )}
      </div>

      {/* Energy this week */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Energy This Week</div>
          <Link href="/student/energy" style={{ fontSize:12, color:T.indigo, textDecoration:'none' }}>Log →</Link>
        </div>
        {(energyLogs?.length ?? 0) === 0 ? (
          <div style={{ fontSize:12, color:T.slate }}>No logs yet — tap Log to record today&apos;s energy.</div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:56 }}>
            {[...(energyLogs ?? [])].reverse().slice(0, 7).map((log, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:3, height:`${(log.score/10)*48}px`, background: log.score>=7?T.emerald:log.score>=5?T.amber:'#EF4444' }} />
                <span style={{ fontSize:9, color:T.slate }}>{new Date(log.log_date).toLocaleDateString('en',{weekday:'short'})}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4-year journey */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.white, marginBottom:12 }}>Your 4-Year Journey</div>
        {[
          { yr:1, label:'Foundation', sub:'AI · CS50x · First Projects', color:T.indigo,  active:true  },
          { yr:2, label:'Depth',      sub:'ML · Deep Learning · Live Apps', color:'#0F7173', active:false },
          { yr:3, label:'Frontier',   sub:'Agents · MCP · AI Club',       color:T.amber,  active:false },
          { yr:4, label:'Legacy',     sub:'Ethics · Research · Portfolio', color:T.emerald,active:false },
        ].map(yr => (
          <div key={yr.yr} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background: yr.active ? yr.color : T.border }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight: yr.active ? 600 : 400, color: yr.active ? T.white : T.slate }}>
                Year {yr.yr} — {yr.label}
              </div>
              <div style={{ fontSize:11, color: yr.active ? yr.color : T.slate }}>{yr.active ? '● ACTIVE NOW' : yr.sub}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
