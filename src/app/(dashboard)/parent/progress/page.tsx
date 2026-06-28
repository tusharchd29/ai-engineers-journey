import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default async function ProgressPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await sb.from('profiles').select('*').eq('role', 'student')
  const student = students?.[0] ?? null
  const sid = student?.id ?? null

  const [
    { data: phases },
    { data: completions },
    { data: milestones },
    { data: milestoneCompletions },
    { data: certs },
  ] = await Promise.all([
    sb.from('phases').select('*').order('year').order('month'),
    sid ? sb.from('task_completions').select('task_id').eq('student_id', sid) : { data: [] },
    sb.from('milestones').select('*').order('display_order'),
    sid ? sb.from('milestone_completions').select('milestone_id').eq('student_id', sid) : { data: [] },
    sid ? sb.from('certificates').select('*').eq('student_id', sid).order('display_order') : { data: [] },
  ])

  const doneTaskIds = new Set((completions ?? []).map((c: any) => c.task_id))
  const doneMilestoneIds = new Set((milestoneCompletions ?? []).map((m: any) => m.milestone_id))
  const earnedCerts = (certs ?? []).filter((c: any) => c.earned).length
  const totalCerts = (certs ?? []).length

  // Group phases by year
  const byYear: Record<number, any[]> = {}
  for (const p of phases ?? []) {
    if (!byYear[p.year]) byYear[p.year] = []
    byYear[p.year].push(p)
  }

  const yearLabels: Record<number, string> = { 1:'Foundation', 2:'Depth', 3:'Frontier', 4:'Legacy' }

  return (
    <div style={{ padding:28, fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>
          {student?.name ?? 'Student'}&apos;s Progress
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          Full 4-year curriculum overview · {earnedCerts}/{totalCerts} certificates earned
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Tasks Done',    value: doneTaskIds.size,   color:T.emerald },
          { label:'Milestones',    value:`${doneMilestoneIds.size}/${(milestones ?? []).length}`, color:T.indigo },
          { label:'Certificates',  value:`${earnedCerts}/${totalCerts}`, color:T.amber },
          { label:'Phases Active', value: (phases ?? []).filter(p => p.is_active).length, color:T.indigoL },
        ].map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Year by year */}
      {Object.keys(byYear).map(yr => {
        const yearNum = parseInt(yr)
        const yearPhases = byYear[yearNum]
        return (
          <div key={yr} style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Year {yr} — {yearLabels[yearNum]}</div>
              <div style={{ flex:1, height:1, background:T.border }} />
              <div style={{ fontSize:11, color:T.slate }}>Class {8 + yearNum}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {yearPhases.map((p, i) => {
                const isActive = p.is_active
                return (
                  <div key={p.id} style={{
                    background: isActive ? `${p.color}12` : T.navy2,
                    border:`1px solid ${isActive ? p.color+'50' : T.border}`,
                    borderRadius:10, padding:14,
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ fontSize:9, color:T.slate, textTransform:'uppercase', letterSpacing:'0.06em' }}>Month {p.month}</div>
                      <div style={{ fontSize:9, padding:'2px 7px', borderRadius:20, background:`${p.color}20`, color:p.color }}>{p.badge}</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color: isActive ? T.white : T.slate, lineHeight:1.3, marginBottom:4 }}>{p.label}</div>
                    <div style={{ fontSize:10, color:T.slate, lineHeight:1.5 }}>{p.focus}</div>
                    {isActive && (
                      <div style={{ marginTop:8, fontSize:10, color:p.color, fontWeight:600 }}>● ACTIVE NOW</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Certificates */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Certificates</div>
          <div style={{ flex:1, height:1, background:T.border }} />
          <div style={{ fontSize:11, color:T.slate }}>{earnedCerts} of {totalCerts} earned</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {(certs ?? []).map((c: any) => (
            <div key={c.id} style={{ background: c.earned ? `${T.amber}10` : T.navy2, border:`1px solid ${c.earned ? T.amber+'40' : T.border}`, borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, opacity: c.earned ? 1 : 0.6 }}>
              <span style={{ fontSize:16 }}>{c.earned ? '🏅' : '🔒'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color: c.earned ? T.white : T.slate }}>{c.name}</div>
                <div style={{ fontSize:10, color:T.slate }}>{c.provider} · Year {c.year_target}</div>
              </div>
              {c.earned && <div style={{ fontSize:9, padding:'2px 7px', borderRadius:20, background:`${T.amber}25`, color:T.amber, fontWeight:700 }}>EARNED</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
