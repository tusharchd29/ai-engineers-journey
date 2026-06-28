import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = {
  navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47',
  indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC',
  amber:'#E8A838', emerald:'#10B981',
}

export default async function ParentDashboard() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await sb.from('profiles').select('*').eq('role', 'student')
  const student = students?.[0] ?? null

  const studentId = student?.id ?? null

  const { data: completions } = studentId
    ? await sb.from('task_completions').select('*').eq('student_id', studentId)
    : { data: [] }

  const { data: energyLogs } = studentId
    ? await sb.from('energy_logs').select('*').eq('student_id', studentId).order('log_date', { ascending: false }).limit(7)
    : { data: [] }

  const { data: burnoutFlags } = studentId
    ? await sb.from('burnout_flags').select('*').eq('student_id', studentId).eq('is_active', true)
    : { data: [] }

  const { data: pending } = studentId
    ? await sb.from('task_completions').select('*, tasks(*)').eq('student_id', studentId).eq('parent_approved', false).order('completed_at', { ascending: false }).limit(5)
    : { data: [] }

  const safeCompletions   = completions   ?? []
  const safeEnergyLogs    = energyLogs    ?? []
  const safeBurnoutFlags  = burnoutFlags  ?? []
  const safePending       = pending       ?? []

  const avgEnergy = safeEnergyLogs.length > 0
    ? (safeEnergyLogs.reduce((s: number, l: any) => s + (l.score ?? 0), 0) / safeEnergyLogs.length).toFixed(1)
    : '—'

  const stats = [
    { label:'Completions',      value: safeCompletions.length,  sub:'total tasks done',         color: T.emerald },
    { label:'Pending Approval', value: safePending.length,      sub:'awaiting your review',     color: safePending.length > 0 ? T.amber : T.emerald },
    { label:'Energy Avg',       value: avgEnergy,               sub:'out of 10 this week',      color: T.indigo  },
    { label:'Burnout Flags',    value: safeBurnoutFlags.length, sub: safeBurnoutFlags.length > 0 ? '⚠ active' : '✓ clear', color: safeBurnoutFlags.length > 0 ? '#EF4444' : T.emerald },
  ]

  const protocol = [
    { level:'Green', desc:'Energy 7–10, on track, school normal. Check in weekly.',         color: T.emerald },
    { level:'Amber', desc:'Energy 4–6, sessions feel forced, or school harder. Talk first.',color: T.amber   },
    { level:'Red',   desc:'Energy ≤3, school declining, or asking to quit. Pause curriculum.', color:'#EF4444' },
  ]

  const checkIn = [
    "How was this week's curriculum work?",
    'What went well? What was hard?',
    'Is the pace feeling sustainable?',
    'Anything that felt overwhelming?',
    'How is school holding up?',
  ]

  return (
    <div style={{ padding:28, fontFamily:'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>
          {student?.name ?? 'Student'}&apos;s Journey 📊
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          Phase 1 · Month 1 · {safeBurnoutFlags.length > 0 ? '⚠ Attention needed' : '✓ All good'}
        </div>
      </div>

      {/* Burnout alert */}
      {safeBurnoutFlags.length > 0 && (
        <div style={{ marginBottom:18, padding:16, background:'#EF444415', border:'1px solid #EF444430', borderRadius:12 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#EF4444', marginBottom:4 }}>⚠ Burnout Flag Active</div>
          <div style={{ fontSize:12, color:T.slate }}>
            {(safeBurnoutFlags[0] as any)?.trigger_reason} · Consider pausing the curriculum and having a conversation.
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

        {/* Pending Approvals */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Pending Approval</div>
            {safePending.length > 0 && (
              <div style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:`${T.amber}20`, color:T.amber }}>
                {safePending.length} items
              </div>
            )}
          </div>
          {safePending.length === 0 ? (
            <div style={{ fontSize:12, color:T.slate, padding:'20px 0', textAlign:'center' }}>
              ✓ All caught up — nothing pending
            </div>
          ) : (
            safePending.map((item: any, i: number) => (
              <div key={i} style={{ background:T.navy3, border:`1px solid ${T.border}`, borderRadius:10, padding:14, marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{item.tasks?.title ?? 'Task'}</div>
                <div style={{ fontSize:11, color:T.slate, marginBottom:10 }}>
                  {item.tasks?.time_estimate} · Submitted {new Date(item.completed_at).toLocaleDateString()}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:`${T.emerald}20`, color:T.emerald, cursor:'pointer' }}>✓ Approve</span>
                  <span style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:`${T.amber}20`, color:T.amber, cursor:'pointer' }}>Review</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Weekly Check-in */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Weekly Check-in Questions</div>
          {checkIn.map((q, i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
              <div style={{ width:20, height:20, borderRadius:6, background:`${T.indigo}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.indigo, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:12, color:T.slate, lineHeight:1.5 }}>{q}</div>
            </div>
          ))}
        </div>

        {/* Energy chart */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>
            Energy Trend · Avg {avgEnergy}/10
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:72, marginBottom:12 }}>
            {safeEnergyLogs.length === 0 ? (
              <div style={{ fontSize:12, color:T.slate }}>No energy logs yet</div>
            ) : (
              [...safeEnergyLogs].reverse().slice(0, 7).map((log: any, i: number) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{
                    width:'100%', borderRadius:4,
                    height:`${((log.score ?? 0) / 10) * 64}px`,
                    background: log.score >= 7 ? T.emerald : log.score >= 5 ? T.amber : '#EF4444',
                    opacity:0.85,
                  }} />
                  <span style={{ fontSize:9, color:T.slate }}>
                    {new Date(log.log_date).toLocaleDateString('en', { weekday:'short' })}
                  </span>
                </div>
              ))
            )}
          </div>
          <div style={{ padding:12, background: safeBurnoutFlags.length > 0 ? '#EF444410' : `${T.emerald}10`, border:`1px solid ${safeBurnoutFlags.length > 0 ? '#EF444430' : T.emerald + '30'}`, borderRadius:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color: safeBurnoutFlags.length > 0 ? '#EF4444' : T.emerald }}>
              {safeBurnoutFlags.length > 0 ? '⚠ Burnout flag active' : '✓ No concerns this week'}
            </div>
          </div>
        </div>

        {/* Protocol */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Parent Response Protocol</div>
          {protocol.map(a => (
            <div key={a.level} style={{ background:`${a.color}10`, border:`1px solid ${a.color}25`, borderRadius:8, padding:12, marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:a.color, marginBottom:4 }}>{a.level}</div>
              <div style={{ fontSize:11, color:T.slate, lineHeight:1.5 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
