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

  const [{ data: phases }, { data: completions }, { data: certs }] = await Promise.all([
    sb.from('phases').select('*').order('year').order('month'),
    sid ? sb.from('task_completions').select('task_id').eq('student_id', sid) : { data: [] },
    sid ? sb.from('certificates').select('*').eq('student_id', sid).order('display_order') : { data: [] },
  ])

  const doneIds = new Set((completions ?? []).map((c: any) => c.task_id))
  const earnedCerts = (certs ?? []).filter((c: any) => c.earned).length

  const byYear: Record<number, any[]> = {}
  for (const p of phases ?? []) {
    if (!byYear[p.year]) byYear[p.year] = []
    byYear[p.year].push(p)
  }
  const yearLabels: Record<number,string> = { 1:'Foundation', 2:'Depth', 3:'Frontier', 4:'Legacy' }

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>
          {student?.name ?? 'Student'}&apos;s Progress
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          {earnedCerts}/{(certs??[]).length} certificates · {doneIds.size} tasks done
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        {[
          { label:'Tasks Done',   value: doneIds.size,                          color:T.emerald },
          { label:'Certificates', value:`${earnedCerts}/${(certs??[]).length}`, color:T.amber   },
          { label:'Active Phase', value: (phases??[]).filter(p=>p.is_active).length, color:T.indigo },
          { label:'Years Left',   value: 4,                                     color:T.slate   },
        ].map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Year by year phases */}
      {[1,2,3,4].map(yr => {
        const yearPhases = byYear[yr] ?? []
        return (
          <div key={yr} style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:yr===1?T.white:T.slate, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Year {yr} — {yearLabels[yr]}
              </div>
              <div style={{ flex:1, height:1, background:T.border }} />
              <div style={{ fontSize:11, color:T.slate }}>Class {8+yr}</div>
            </div>
            {yearPhases.map(p => (
              <div key={p.id} style={{
                background: p.is_active ? `${p.color}12` : T.navy2,
                border:`1px solid ${p.is_active ? p.color+'50' : T.border}`,
                borderRadius:12, padding:'12px 16px', marginBottom:8,
                display:'flex', alignItems:'center', gap:12,
              }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background: p.is_active ? p.color : T.border, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight: p.is_active ? 700 : 400, color: p.is_active ? T.white : T.slate }}>{p.label}</div>
                  <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>Month {p.month} · {p.focus}</div>
                </div>
                <div style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:`${p.color}15`, color:p.color, whiteSpace:'nowrap' }}>
                  {p.is_active ? '● Active' : p.badge}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Certificates */}
      <div style={{ marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Certificates</div>
          <div style={{ flex:1, height:1, background:T.border }} />
          <div style={{ fontSize:11, color:T.slate }}>{earnedCerts} / {(certs??[]).length}</div>
        </div>
        {(certs ?? []).map((c: any) => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: c.earned ? `${T.amber}10` : T.navy2, border:`1px solid ${c.earned ? T.amber+'40' : T.border}`, borderRadius:12, marginBottom:8, opacity: c.earned ? 1 : 0.55 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{c.earned ? '🏅' : '🔒'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color: c.earned ? T.white : T.slate }}>{c.name}</div>
              <div style={{ fontSize:11, color:T.slate }}>{c.provider} · Year {c.year_target}</div>
              {c.earned && c.earned_date && (
                <div style={{ fontSize:11, color:T.amber, marginTop:2 }}>Earned {new Date(c.earned_date).toLocaleDateString('en', { month:'short', year:'numeric' })}</div>
              )}
            </div>
            {c.earned && <div style={{ fontSize:9, padding:'2px 7px', borderRadius:20, background:`${T.amber}25`, color:T.amber, fontWeight:700 }}>EARNED</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
