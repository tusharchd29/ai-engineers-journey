import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { navy2:'#0F1629', border:'#1E2A47', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981', indigo:'#6C63FF' }

export default async function CertsPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: certs } = await sb.from('certificates').select('*').eq('student_id', user.id).order('display_order')

  const all = certs ?? []
  const earned = all.filter(c => c.earned).length
  const byYear: Record<number, typeof all> = {}
  for (const c of all) {
    if (!byYear[c.year_target]) byYear[c.year_target] = []
    byYear[c.year_target].push(c)
  }
  const yearLabels: Record<number, string> = { 1:'Year 1 · Foundation', 2:'Year 2 · Depth', 3:'Year 3 · Frontier', 4:'Year 4 · Legacy' }

  return (
    <div style={{ padding:28, fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>Certificates</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          {earned} earned · {all.length - earned} remaining · Quality over quantity
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 20px', marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.slate }}>Overall Progress</span>
          <span style={{ fontSize:13, fontWeight:600, color:T.amber }}>{earned} / {all.length}</span>
        </div>
        <div style={{ height:6, background:'#141B33', borderRadius:3 }}>
          <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${T.amber},#F5A623)`, width:`${all.length ? Math.round((earned/all.length)*100) : 0}%`, transition:'width 0.5s' }} />
        </div>
      </div>

      {/* By year */}
      {Object.keys(byYear).map(yr => {
        const certs = byYear[parseInt(yr)]
        const yEarned = certs.filter(c => c.earned).length
        return (
          <div key={yr} style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                {yearLabels[parseInt(yr)] ?? `Year ${yr}`}
              </div>
              <div style={{ fontSize:11, color:T.slate }}>{yEarned}/{certs.length} earned</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {certs.map(c => (
                <div key={c.id} style={{
                  background: c.earned ? `${T.amber}10` : T.navy2,
                  border:`1px solid ${c.earned ? T.amber+'40' : T.border}`,
                  borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
                  opacity: c.earned ? 1 : 0.65,
                }}>
                  <div style={{ width:36, height:36, borderRadius:8, background: c.earned ? `${T.amber}25` : '#141B33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {c.earned ? '🏅' : '🔒'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: c.earned ? T.white : T.slate }}>{c.name}</div>
                    <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{c.provider}</div>
                    {c.earned && c.earned_date && (
                      <div style={{ fontSize:10, color:T.amber, marginTop:3 }}>
                        Earned {new Date(c.earned_date).toLocaleDateString('en', { month:'short', year:'numeric' })}
                      </div>
                    )}
                  </div>
                  {c.earned && (
                    <div style={{ padding:'2px 8px', borderRadius:20, background:`${T.amber}25`, color:T.amber, fontSize:10, fontWeight:700 }}>EARNED</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div style={{ padding:16, background:`${T.indigo}10`, border:`1px solid ${T.indigo}25`, borderRadius:12, fontSize:12, color:T.slate, lineHeight:1.6 }}>
        <strong style={{ color:T.white }}>Remember:</strong> These certificates are milestones, not the destination. What matters is the thinking, building, and learning they represent. A certificate without understanding is just paper.
      </div>
    </div>
  )
}
