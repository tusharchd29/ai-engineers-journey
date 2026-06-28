import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default async function WellbeingPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await sb.from('profiles').select('*').eq('role', 'student')
  const student = students?.[0] ?? null
  const sid = student?.id ?? null

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: energyLogs },
    { data: burnoutFlags },
    { data: recentFlags },
  ] = await Promise.all([
    sid ? sb.from('energy_logs').select('*').eq('student_id', sid).gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]).order('log_date') : { data: [] },
    sid ? sb.from('burnout_flags').select('*').eq('student_id', sid).eq('is_active', true) : { data: [] },
    sid ? sb.from('burnout_flags').select('*').eq('student_id', sid).order('triggered_at', { ascending: false }).limit(5) : { data: [] },
  ])

  const safeLogs = energyLogs ?? []
  const safeFlags = burnoutFlags ?? []
  const safeRecent = recentFlags ?? []

  const avg7 = safeLogs.slice(-7).length
    ? (safeLogs.slice(-7).reduce((s: number, l: any) => s + l.score, 0) / safeLogs.slice(-7).length).toFixed(1)
    : '—'
  const avg30 = safeLogs.length
    ? (safeLogs.reduce((s: number, l: any) => s + l.score, 0) / safeLogs.length).toFixed(1)
    : '—'
  const loggingStreak = safeLogs.length

  const protocol = [
    { level:'🟢 Green', range:'Energy 7–10', action:'Weekly check-in only. All clear.', color:T.emerald },
    { level:'🟡 Amber', range:'Energy 4–6 or feeling forced', action:'Have a 10-min conversation. Reduce weekend sessions if needed.', color:T.amber },
    { level:'🔴 Red', range:'Energy ≤3 or school declining', action:'Pause curriculum. Address school and wellbeing first. Resume only when ready.', color:'#EF4444' },
  ]

  const checkInQuestions = [
    'How was the curriculum this week — enjoyable or a chore?',
    'Is the pace feeling sustainable with school?',
    'Any sessions felt overwhelming or rushed?',
    'What did Rishona build or learn this week?',
    'Is school performance holding up well?',
    'Any topics she\'s particularly excited about?',
  ]

  const currentStatus = safeFlags.length > 0
    ? { label:'⚠ Burnout Flag Active', color:'#EF4444', bg:'#EF444415', border:'#EF444430' }
    : parseFloat(avg7 as string) >= 7
    ? { label:'✓ Healthy — Green Zone', color:T.emerald, bg:`${T.emerald}10`, border:`${T.emerald}30` }
    : parseFloat(avg7 as string) >= 5
    ? { label:'⚡ Monitor — Amber Zone', color:T.amber, bg:`${T.amber}10`, border:`${T.amber}30` }
    : avg7 === '—'
    ? { label:'No data yet', color:T.slate, bg:T.navy3, border:T.border }
    : { label:'⚠ Low Energy — Check In', color:'#EF4444', bg:'#EF444415', border:'#EF444430' }

  return (
    <div style={{ padding:28, fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>
          Wellbeing Monitor
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          {student?.name ?? 'Student'}&apos;s energy, burnout risk, and sustainability
        </div>
      </div>

      {/* Status banner */}
      <div style={{ marginBottom:20, padding:16, background:currentStatus.bg, border:`1px solid ${currentStatus.border}`, borderRadius:12 }}>
        <div style={{ fontSize:15, fontWeight:700, color:currentStatus.color }}>{currentStatus.label}</div>
        <div style={{ fontSize:12, color:T.slate, marginTop:4 }}>
          7-day avg: <strong style={{ color:currentStatus.color }}>{avg7}/10</strong> · 30-day avg: <strong style={{ color:T.slate }}>{avg30}/10</strong> · {loggingStreak} logs this month
        </div>
      </div>

      {/* Active burnout flags */}
      {safeFlags.length > 0 && safeFlags.map((flag: any) => (
        <div key={flag.id} style={{ marginBottom:14, padding:16, background:'#EF444415', border:'1px solid #EF444430', borderRadius:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#EF4444', marginBottom:4 }}>
            {flag.flag_type === 'red' ? '🔴 RED Flag' : '🟡 Amber Flag'} Active
          </div>
          <div style={{ fontSize:12, color:T.slate }}>
            {flag.trigger_reason} · Triggered {new Date(flag.triggered_at).toLocaleDateString('en', { day:'numeric', month:'short' })}
          </div>
        </div>
      ))}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Energy chart — 30 days */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Energy — Last 30 Days</div>
          <div style={{ fontSize:11, color:T.slate, marginBottom:14 }}>Each bar = one log · Green ≥7 · Amber ≥5 · Red ≤4</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:80, marginBottom:8 }}>
            {safeLogs.length === 0 ? (
              <div style={{ fontSize:12, color:T.slate }}>No energy logs recorded yet</div>
            ) : safeLogs.slice(-30).map((log: any, i: number) => (
              <div key={i} style={{ flex:1, borderRadius:3, height:`${(log.score/10)*76}px`, background: log.score>=7?T.emerald:log.score>=5?T.amber:'#EF4444', opacity:0.8, minWidth:6 }} />
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.slate }}>
            <span>30 days ago</span><span>Today</span>
          </div>
        </div>

        {/* Check-in guide */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Weekly Check-in Guide</div>
          {checkInQuestions.map((q, i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
              <div style={{ width:18, height:18, borderRadius:5, background:`${T.indigo}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:T.indigo, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:11, color:T.slate, lineHeight:1.5 }}>{q}</div>
            </div>
          ))}
        </div>

        {/* Protocol */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Response Protocol</div>
          {protocol.map(p => (
            <div key={p.level} style={{ background:`${p.color}10`, border:`1px solid ${p.color}25`, borderRadius:8, padding:12, marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:p.color, marginBottom:3 }}>{p.level} · {p.range}</div>
              <div style={{ fontSize:11, color:T.slate, lineHeight:1.5 }}>{p.action}</div>
            </div>
          ))}
          <div style={{ marginTop:12, padding:10, background:T.navy3, borderRadius:8, fontSize:11, color:T.slate, lineHeight:1.6 }}>
            <strong style={{ color:T.white }}>Remember:</strong> School always comes first. The curriculum exists to support Rishona&apos;s growth — never to add pressure. If in doubt, pause. The content will wait.
          </div>
        </div>

        {/* Flag history */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Flag History</div>
          {safeRecent.length === 0 ? (
            <div style={{ fontSize:12, color:T.slate, textAlign:'center', padding:'20px 0' }}>
              ✓ No burnout flags on record — excellent pace
            </div>
          ) : safeRecent.map((flag: any) => (
            <div key={flag.id} style={{ background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, padding:12, marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:600, color: flag.flag_type==='red'?'#EF4444':T.amber }}>
                  {flag.flag_type === 'red' ? '🔴 Red' : '🟡 Amber'}
                </div>
                <div style={{ fontSize:10, color:T.slate }}>{new Date(flag.triggered_at).toLocaleDateString('en', { day:'numeric', month:'short' })}</div>
              </div>
              <div style={{ fontSize:11, color:T.slate }}>{flag.trigger_reason}</div>
              {flag.action_taken && (
                <div style={{ fontSize:10, color:T.emerald, marginTop:4 }}>Action: {flag.action_taken}</div>
              )}
              {!flag.is_active && (
                <div style={{ fontSize:10, color:T.emerald, marginTop:4 }}>✓ Resolved</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
