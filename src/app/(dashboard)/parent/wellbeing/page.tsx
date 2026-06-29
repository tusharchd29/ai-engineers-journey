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

  const since = new Date(); since.setDate(since.getDate() - 30)
  const [{ data: energyLogs }, { data: activeFlags }, { data: allFlags }] = await Promise.all([
    sid ? sb.from('energy_logs').select('*').eq('student_id', sid).gte('log_date', since.toISOString().split('T')[0]).order('log_date') : { data: [] },
    sid ? sb.from('burnout_flags').select('*').eq('student_id', sid).eq('is_active', true) : { data: [] },
    sid ? sb.from('burnout_flags').select('*').eq('student_id', sid).order('triggered_at', { ascending:false }).limit(5) : { data: [] },
  ])

  const logs  = energyLogs ?? []
  const flags = activeFlags ?? []
  const hist  = allFlags ?? []

  const avg7  = logs.slice(-7).length  ? (logs.slice(-7).reduce((s:number,l:any)=>s+l.score,0)/logs.slice(-7).length).toFixed(1) : '—'
  const avg30 = logs.length            ? (logs.reduce((s:number,l:any)=>s+l.score,0)/logs.length).toFixed(1) : '—'

  const status = flags.length > 0         ? { label:'⚠ Burnout Flag Active',   color:'#EF4444', bg:'#EF444415', border:'#EF444430' }
    : parseFloat(avg7) >= 7              ? { label:'✓ Green — Healthy Pace',   color:T.emerald, bg:`${T.emerald}10`, border:`${T.emerald}30` }
    : parseFloat(avg7) >= 5              ? { label:'⚡ Amber — Monitor',        color:T.amber,   bg:`${T.amber}10`,   border:`${T.amber}30`   }
    : avg7 === '—'                       ? { label:'No data yet',               color:T.slate,   bg:T.navy3,          border:T.border         }
                                         : { label:'⚠ Red — Check In Today',   color:'#EF4444', bg:'#EF444415',      border:'#EF444430'      }

  const scoreColor = (s:number) => s>=7 ? T.emerald : s>=5 ? T.amber : '#EF4444'

  const protocol = [
    { level:'🟢 Green', range:'Energy 7–10', action:'Weekly check-in only. All clear.',                                     color:T.emerald },
    { level:'🟡 Amber', range:'Energy 4–6',  action:'10-min conversation. Reduce weekend sessions if needed.',              color:T.amber   },
    { level:'🔴 Red',   range:'Energy ≤3',   action:'Pause curriculum. School and wellbeing first. Resume when ready.',     color:'#EF4444' },
  ]
  const checkIn = [
    'How was the curriculum this week — enjoyable or a chore?',
    'Is the pace feeling sustainable with school?',
    'Any sessions felt overwhelming or rushed?',
    'What did Rishona build or learn this week?',
    'Is school performance holding up?',
    'Any topics she is particularly excited about?',
  ]

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>Wellbeing</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{student?.name}&apos;s energy and sustainability</div>
      </div>

      {/* Status banner */}
      <div style={{ padding:'14px 16px', background:status.bg, border:`1px solid ${status.border}`, borderRadius:12, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:status.color }}>{status.label}</div>
        <div style={{ fontSize:12, color:T.slate, marginTop:4 }}>
          7-day avg <strong style={{ color:status.color }}>{avg7}/10</strong> · 30-day avg {avg30}/10 · {logs.length} logs this month
        </div>
      </div>

      {/* Active flags */}
      {flags.map((flag:any) => (
        <div key={flag.id} style={{ padding:'12px 16px', background:'#EF444415', border:'1px solid #EF444430', borderRadius:12, marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#EF4444', marginBottom:3 }}>
            {flag.flag_type === 'red' ? '🔴 RED Flag' : '🟡 Amber Flag'} — Active
          </div>
          <div style={{ fontSize:12, color:T.slate }}>{flag.trigger_reason}</div>
          <div style={{ fontSize:12, color:T.slate, marginTop:4 }}>
            Triggered {new Date(flag.triggered_at).toLocaleDateString('en', { day:'numeric', month:'short' })}
          </div>
        </div>
      ))}

      {/* Energy chart */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:18, marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.white, marginBottom:14 }}>Energy — Last 30 Days</div>
        {logs.length === 0 ? (
          <div style={{ fontSize:12, color:T.slate, textAlign:'center', padding:'16px 0' }}>No energy logs yet</div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:80 }}>
            {logs.slice(-30).map((log:any, i:number) => (
              <div key={i} style={{ flex:1, borderRadius:3, background:scoreColor(log.score), opacity:0.85, height:`${(log.score/10)*74}px`, minWidth:5 }} />
            ))}
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.slate, marginTop:6 }}>
          <span>30 days ago</span><span>Today</span>
        </div>
      </div>

      {/* Protocol */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:18, marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.white, marginBottom:12 }}>Response Protocol</div>
        {protocol.map(p => (
          <div key={p.level} style={{ background:`${p.color}10`, border:`1px solid ${p.color}25`, borderRadius:10, padding:12, marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:700, color:p.color, marginBottom:3 }}>{p.level} · {p.range}</div>
            <div style={{ fontSize:12, color:T.slate, lineHeight:1.5 }}>{p.action}</div>
          </div>
        ))}
        <div style={{ marginTop:10, padding:12, background:T.navy3, borderRadius:10, fontSize:12, color:T.slate, lineHeight:1.6 }}>
          <strong style={{ color:T.white }}>Remember:</strong> School always comes first. If in doubt, pause. The content will wait.
        </div>
      </div>

      {/* Check-in guide */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:18, marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.white, marginBottom:12 }}>Weekly Check-in Guide</div>
        {checkIn.map((q, i) => (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
            <div style={{ width:22, height:22, borderRadius:6, background:`${T.indigo}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:T.indigo, fontWeight:700, flexShrink:0 }}>{i+1}</div>
            <div style={{ fontSize:13, color:T.slate, lineHeight:1.5 }}>{q}</div>
          </div>
        ))}
      </div>

      {/* Flag history */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.white, marginBottom:12 }}>Flag History</div>
        {hist.length === 0 ? (
          <div style={{ fontSize:13, color:T.emerald, textAlign:'center', padding:'12px 0' }}>✓ No burnout flags on record — excellent pace</div>
        ) : hist.map((flag:any) => (
          <div key={flag.id} style={{ background:T.navy3, border:`1px solid ${T.border}`, borderRadius:10, padding:12, marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:600, color: flag.flag_type==='red'?'#EF4444':T.amber }}>
                {flag.flag_type === 'red' ? '🔴 Red' : '🟡 Amber'}
              </span>
              <span style={{ fontSize:11, color:T.slate }}>{new Date(flag.triggered_at).toLocaleDateString('en', { day:'numeric', month:'short' })}</span>
            </div>
            <div style={{ fontSize:12, color:T.slate }}>{flag.trigger_reason}</div>
            {!flag.is_active && <div style={{ fontSize:11, color:T.emerald, marginTop:4 }}>✓ Resolved</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
