import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0', purple:'#7C6FE0', purpleL:'#A99EF0', text:'#2D2352', muted:'#8B82B8', mint:'#5EC990' }

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
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>12-Phase Roadmap</div>
        <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>4 years · ~780 hours · School always first</div>
      </div>

      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:20, paddingBottom:4 }}>
        {['Explorer','Builder','Developer','AI Engineer','Researcher','Innovator','Leader','Ivy'].map((s, i) => (
          <div key={s} style={{
            flexShrink:0, padding:'5px 10px', borderRadius:20,
            background: i === 0 ? T.surface2 : T.surface,
            border:`1px solid ${i === 0 ? T.purple+'50' : T.border}`,
            fontSize:11, color: i === 0 ? T.purple : T.muted, whiteSpace:'nowrap',
          }}>{s}</div>
        ))}
      </div>

      {[1,2,3,4].map(yr => {
        const info = yearInfo[yr]
        const yearPhases = byYear[yr] ?? []
        return (
          <div key={yr} style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'10px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 1px 6px rgba(124,111,224,0.04)' }}>
              <span style={{ fontSize:20 }}>{info.emoji}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{info.label}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{info.sub}</div>
              </div>
            </div>
            {yearPhases.map((p, i) => {
              const isActive = p.is_active
              const globalIdx = all.findIndex(x => x.id === p.id)
              return (
                <div key={p.id} style={{
                  background: isActive ? T.surface2 : T.surface,
                  border:`1.5px solid ${isActive ? T.purple+'60' : T.border}`,
                  borderRadius:12, padding:'14px 16px', marginBottom:10,
                  position:'relative',
                  boxShadow: isActive ? '0 2px 12px rgba(124,111,224,0.10)' : '0 1px 4px rgba(124,111,224,0.04)',
                }}>
                  {isActive && (
                    <div style={{ position:'absolute', top:12, right:12, fontSize:10, padding:'2px 8px', borderRadius:20, background:`${T.mint}20`, color:T.mint, fontWeight:700 }}>
                      ● ACTIVE
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:T.surface2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:T.purple, fontWeight:700, flexShrink:0 }}>
                      {globalIdx + 1}
                    </div>
                    <div style={{ fontSize:10, color:T.muted }}>Month {p.month} · {p.phase_name}</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color: isActive ? T.text : T.muted, marginBottom:6, lineHeight:1.3 }}>
                    {p.label}
                  </div>
                  {p.focus && (
                    <div style={{ fontSize:12, color:T.muted, lineHeight:1.5, marginBottom:8 }}>{p.focus}</div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:11, color:T.muted }}>
                      {isActive ? `${p.weekday_time} · ${p.weekend_time}` : ''}
                    </div>
                    <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:T.surface2, color:T.purple }}>{p.badge}</div>
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
