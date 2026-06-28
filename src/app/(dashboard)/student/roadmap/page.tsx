import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default async function RoadmapPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: phases } = await sb.from('phases').select('*').order('year').order('month')

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>12-Phase Roadmap</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>4 years · ~780 hours · School always first · 4.5 hrs/week maximum</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {(phases ?? []).map((p, i) => (
          <div key={p.id} style={{
            background: i === 0 ? `${p.color}15` : T.navy2,
            border:`1px solid ${i === 0 ? p.color+'50' : T.border}`,
            borderRadius:12, padding:16,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:10, color:p.color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Year {p.year} · Month {p.month}
              </div>
              <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${p.color}20`, color:p.color }}>
                {p.badge}
              </div>
            </div>
            <div style={{ fontSize:14, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', marginBottom:6, lineHeight:1.3 }}>
              {p.label}
            </div>
            <div style={{ fontSize:11, color:T.slate, marginBottom:10, lineHeight:1.5 }}>{p.focus}</div>
            {i === 0 ? (
              <div style={{ fontSize:11, color:p.color, fontWeight:600 }}>● Active now</div>
            ) : (
              <div style={{ fontSize:11, color:T.slate, display:'flex', alignItems:'center', gap:4 }}>
                <span>🔒</span> Unlocks sequentially
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
