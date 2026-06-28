import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return (
    <div style={{ padding:28, fontFamily:'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>
          Good day, {profile?.name?.split(' ')[0]} 👋
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          {currentPhase?.phase_name} · {currentPhase?.label} · {currentPhase?.badge}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Tasks Done',    value:`${doneTasks}/${totalTasks}`, sub:'this phase',    color:T.emerald },
          { label:'Phase',         value:`${pct}%`,                   sub:'completed',     color:T.indigo  },
          { label:'Energy Avg',    value:avgEnergy,                   sub:'out of 10',     color:T.amber   },
          { label:'Burnout Flags', value:burnoutFlags?.length ?? 0,   sub: burnoutFlags?.length ? '⚠ active' : '✓ clear', color: burnoutFlags?.length ? '#EF4444' : T.emerald },
        ].map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Current Phase */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Current Phase</div>
          <div style={{ display:'inline-block', fontSize:10, padding:'3px 10px', borderRadius:20, background:`${currentPhase?.color}20`, color:currentPhase?.color, marginBottom:10 }}>
            {currentPhase?.badge}
          </div>
          <div style={{ fontSize:16, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', marginBottom:6, lineHeight:1.3 }}>
            {currentPhase?.label}
          </div>
          <div style={{ fontSize:12, color:T.slate, marginBottom:16 }}>{currentPhase?.focus}</div>
          <div style={{ marginBottom:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, color:T.slate }}>Progress</span>
              <span style={{ fontSize:11, color:T.indigo, fontWeight:600 }}>{pct}%</span>
            </div>
            <div style={{ height:6, background:T.navy3, borderRadius:3 }}>
              <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${T.indigo},${T.indigoL})`, width:`${pct}%`, transition:'width 0.5s' }} />
            </div>
          </div>
          <div style={{ marginTop:14, fontSize:11, color:T.slate }}>
            Weekday: {currentPhase?.weekday_time} · Weekend: {currentPhase?.weekend_time}
          </div>
        </div>

        {/* Recent Tasks */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Phase Tasks</div>
          {(tasks ?? []).slice(0, 5).map(task => {
            const done = completedIds.has(task.id)
            return (
              <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, background: done ? T.emerald : 'transparent', border:`2px solid ${done ? T.emerald : T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {done && <span style={{ fontSize:10, color:'#fff' }}>✓</span>}
                </div>
                <span style={{ fontSize:12, color: done ? T.slate : T.white, textDecoration: done ? 'line-through' : 'none', flex:1 }}>
                  {task.title}
                </span>
                <span style={{ fontSize:10, color:T.slate }}>{task.time_estimate}</span>
              </div>
            )
          })}
          {(tasks?.length ?? 0) > 5 && (
            <div style={{ marginTop:8, fontSize:11, color:T.indigo }}>
              +{(tasks?.length ?? 0) - 5} more tasks →
            </div>
          )}
        </div>

        {/* Energy Log */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Energy This Week</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:60, marginBottom:12 }}>
            {(energyLogs ?? []).slice(0,7).reverse().map((log, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:'100%', borderRadius:4, height:`${(log.score/10)*52}px`, background: log.score>=7?T.emerald:log.score>=5?T.amber:'#EF4444', opacity:0.85 }} />
                <span style={{ fontSize:9, color:T.slate }}>{new Date(log.log_date).toLocaleDateString('en',{weekday:'short'})}</span>
              </div>
            ))}
            {(energyLogs?.length ?? 0) === 0 && (
              <div style={{ flex:1, fontSize:12, color:T.slate }}>No energy logs yet. Log your first one in Energy Log →</div>
            )}
          </div>
          <div style={{ fontSize:11, color: (burnoutFlags?.length ?? 0) > 0 ? '#EF4444' : T.emerald }}>
            {(burnoutFlags?.length ?? 0) > 0 ? '⚠ Burnout flag active — talk to Tushar' : '✓ No burnout flags · Healthy pace'}
          </div>
        </div>

        {/* 4-Year Map */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Your 4-Year Journey</div>
          {[
            { yr:1, label:'Foundation', focus:'AI Literacy · CS50x · First Projects', color:T.indigo,  active:true  },
            { yr:2, label:'Depth',      focus:'ML · Deep Learning · Live Apps',       color:'#0F7173', active:false },
            { yr:3, label:'Frontier',   focus:'Agents · MCP · AI Club',              color:T.amber,  active:false },
            { yr:4, label:'Legacy',     focus:'Ethics · Research · Portfolio',        color:T.emerald,active:false },
          ].map(yr => (
            <div key={yr.yr} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: yr.active ? yr.color : T.border, flexShrink:0 }} />
              <div>
                <span style={{ fontSize:12, fontWeight: yr.active ? 600 : 400, color: yr.active ? T.white : T.slate }}>Year {yr.yr} — {yr.label}</span>
                {yr.active && <div style={{ fontSize:10, color:yr.color }}>ACTIVE NOW</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
