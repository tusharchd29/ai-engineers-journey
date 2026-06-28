import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default async function ParentDashboard() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  // Find Rishona's profile (the student)
  const { data: students } = await sb.from('profiles').select('*').eq('role', 'student')
  const student = students?.[0]

  const [{ data: phases }, { data: completions }, { data: energyLogs }, { data: burnoutFlags }, { data: pending }] = await Promise.all([
    sb.from('phases').select('*').order('year').order('month').limit(12),
    student ? sb.from('task_completions').select('*').eq('student_id', student.id) : Promise.resolve({ data: [] }),
    student ? sb.from('energy_logs').select('*').eq('student_id', student.id).order('log_date', { ascending: false }).limit(7) : Promise.resolve({ data: [] }),
    student ? sb.from('burnout_flags').select('*').eq('student_id', student.id).eq('is_active', true) : Promise.resolve({ data: [] }),
    student ? sb.from('task_completions').select('*, tasks(*)').eq('student_id', student.id).eq('parent_approved', false).order('completed_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
  ])

  const avgEnergy = energyLogs?.length
    ? (energyLogs.reduce((s, l) => s + l.score, 0) / energyLogs.length).toFixed(1)
    : '—'

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>
          {student?.name}&apos;s Journey 📊
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          Phase 1 · Month 1 · {(burnoutFlags?.length ?? 0) > 0 ? '⚠ Attention needed' : '✓ All good'}
        </div>
      </div>

      {/* Burnout alert */}
      {(burnoutFlags?.length ?? 0) > 0 && (
        <div style={{ marginBottom:18, padding:16, background:'#EF444415', border:'1px solid #EF444430', borderRadius:12 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#EF4444', marginBottom:4 }}>⚠ Burnout Flag Active</div>
          <div style={{ fontSize:12, color:T.slate }}>{burnoutFlags?.[0]?.trigger_reason} · Consider pausing the curriculum and having a conversation.</div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Completions',   value: completions?.length ?? 0,      sub:'total tasks done',   color:T.emerald },
          { label:'Pending Approval', value: pending?.length ?? 0,       sub:'awaiting your review', color: (pending?.length ?? 0) > 0 ? T.amber : T.emerald },
          { label:'Energy Avg',    value: avgEnergy,                     sub:'out of 10 this week', color:T.indigo  },
          { label:'Burnout Flags', value: burnoutFlags?.length ?? 0,     sub: (burnoutFlags?.length ?? 0) > 0 ? '⚠ active' : '✓ clear', color: (burnoutFlags?.length ?? 0) > 0 ? '#EF4444' : T.emerald },
        ].map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Pending Approvals */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Pending Approval</div>
            {(pending?.length ?? 0) > 0 && (
              <div style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:`${T.amber}20`, color:T.amber }}>
                {pending?.length} items
              </div>
            )}
          </div>
          {(pending?.length ?? 0) === 0 ? (
            <div style={{ fontSize:12, color:T.slate, padding:'20px 0', textAlign:'center' as const }}>
              ✓ All caught up — nothing pending
            </div>
          ) : (
            (pending ?? []).map((item: any, i: number) => (
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
          {[
            'How was this week's curriculum work?',
            'What went well? What was hard?',
            'Is the pace feeling sustainable?',
            'Anything that felt overwhelming?',
            'How is school holding up?',
          ].map((q, i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
              <div style={{ width:20, height:20, borderRadius:6, background:`${T.indigo}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.indigo, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:12, color:T.slate, lineHeight:1.5 }}>{q}</div>
            </div>
          ))}
        </div>

        {/* Energy */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Energy Trend</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:72, marginBottom:12 }}>
            {(energyLogs ?? []).slice(0,7).reverse().map((log: any, i: number) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:'100%', borderRadius:4, height:`${(log.score/10)*64}px`, background: log.score>=7?T.emerald:log.score>=5?T.amber:'#EF4444', opacity:0.85 }} />
                <span style={{ fontSize:9, color:T.slate }}>{new Date(log.log_date).toLocaleDateString('en',{weekday:'short'})}</span>
              </div>
            ))}
            {(energyLogs?.length ?? 0) === 0 && <div style={{ color:T.slate, fontSize:12 }}>No logs yet</div>}
          </div>
          <div style={{ padding:12, background: (burnoutFlags?.length ?? 0) > 0 ? '#EF444410' : `${T.emerald}10`, border:`1px solid ${(burnoutFlags?.length ?? 0) > 0 ? '#EF444430' : T.emerald+'30'}`, borderRadius:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color: (burnoutFlags?.length ?? 0) > 0 ? '#EF4444' : T.emerald }}>
              {(burnoutFlags?.length ?? 0) > 0 ? '⚠ Burnout flag active' : '✓ No concerns this week'}
            </div>
          </div>
        </div>

        {/* Protocol */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Parent Response Protocol</div>
          {[
            { level:'Green', desc:'Energy 7–10, on track, school normal. Check in weekly.', color:T.emerald },
            { level:'Amber', desc:'Energy 4–6, sessions feel forced, or school harder. Have a conversation.', color:T.amber },
            { level:'Red',   desc:'Energy ≤3, school declining, or asking to quit. Pause curriculum.', color:'#EF4444' },
          ].map(a => (
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
