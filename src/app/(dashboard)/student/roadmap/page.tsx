import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default async function RoadmapPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: phases } = await sb.from('phases').select('*').order('year').order('month')
  const all = phases ?? []

  const byYear: Record<number, typeof all> = {}
  for (const p of all) {
    if (!byYear[p.year]) byYear[p.year] = []
    byYear[p.year].push(p)
  }

  const yearInfo: Record<number, { label: string; sub: string; emoji: string }> = {
    1: { label: 'Year 1 — Foundation', sub: 'Class 9 · AI Literacy · CS50x · First Projects', emoji: '🌱' },
    2: { label: 'Year 2 — Depth',      sub: 'Class 10 · ML · Deep Learning · Live Apps',      emoji: '⚙️' },
    3: { label: 'Year 3 — Frontier',   sub: 'Class 11 · Agents · MCP · AI Club',             emoji: '🚀' },
    4: { label: 'Year 4 — Legacy',     sub: 'Class 12 · Ethics · Research · Portfolio',       emoji: '🏆' },
  }

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>12-Phase Roadmap</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>4 years · ~780 hours · School always first</div>
      </div>

      {/* Career stages strip */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:20, paddingBottom:4 }}>
        {['Explorer','Builder','Developer','AI Engineer','Researcher','Innovator','Leader','Ivy'].map((s, i) => (
          <div key={s} style={{
            flexShrink:0, padding:'5px 10px', borderRadius:20,
            background: i === 0 ? `${T.indigo}25` : T.navy2,
            border:`1px solid ${i === 0 ? T.indigo+'60' : T.border}`,
            fontSize:11, color: i === 0 ? T.indigoL : T.slate, whiteSpace:'nowrap',
          }}>{s}</div>
        ))}
      </div>

      {/* Year sections */}
      {[1,2,3,4].map(yr => {
        const info = yearInfo[yr]
        const yearPhases = byYear[yr] ?? []
        return (
          <div key={yr} style={{ marginBottom:24 }}>
            {/* Year header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'10px 14px', background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12 }}>
              <span style={{ fontSize:20 }}>{info.emoji}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{info.label}</div>
                <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{info.sub}</div>
              </div>
            </div>

            {/* Phase cards */}
            {yearPhases.map((p, i) => {
              const isActive = p.is_active
              const globalIdx = all.findIndex(x => x.id === p.id)
              return (
                <div key={p.id} style={{
                  background: isActive ? `${p.color}12` : T.navy2,
                  border:`1px solid ${isActive ? p.color+'60' : T.border}`,
                  borderRadius:12, padding:'14px 16px', marginBottom:10,
                  position:'relative',
                }}>
                  {isActive && (
                    <div style={{ position:'absolute', top:12, right:12, fontSize:10, padding:'2px 8px', borderRadius:20, background:`${p.color}25`, color:p.color, fontWeight:700 }}>
                      ● ACTIVE
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`${p.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:p.color, fontWeight:700, flexShrink:0 }}>
                      {globalIdx + 1}
                    </div>
                    <div style={{ fontSize:10, color:T.slate }}>Month {p.month} · {p.phase_name}</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color: isActive ? T.white : T.slate, marginBottom:6, lineHeight:1.3 }}>
                    {p.label}
                  </div>
                  {p.focus && (
                    <div style={{ fontSize:12, color:T.slate, lineHeight:1.5, marginBottom:8 }}>{p.focus}</div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:11, color:T.slate }}>
                      {isActive ? `${p.weekday_time} · ${p.weekend_time}` : isActive === false && globalIdx > 0 ? '🔒 Upcoming' : ''}
                    </div>
                    <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${p.color}15`, color:p.color }}>{p.badge}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
