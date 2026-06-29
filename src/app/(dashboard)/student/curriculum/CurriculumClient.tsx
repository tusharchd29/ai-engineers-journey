'use client'
import { useState } from 'react'

const T = {
  bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0',
  purple:'#7C6FE0', purpleL:'#A99EF0', text:'#2D2352', muted:'#8B82B8',
  peach:'#F59E6C', mint:'#5EC990', sky:'#64BFDF', red:'#F27171',
}

interface Phase {
  id: string; phase_name: string; label: string; year: number; month: number
  color: string; badge: string; focus: string|null; is_active: boolean
  phase_number: number; course_url: string|null; course_title: string|null
  weekday_time: string|null; weekend_time: string|null; estimated_hours: string|null
}
interface Task {
  id: string; phase_id: string; title: string; description: string|null
  task_type: string; task_order: number; time_estimate: string; resource_url: string|null; requires_proof: boolean
}
interface Completion { task_id: string; parent_approved: boolean }
interface Props { userId: string; phases: Phase[]; tasks: Task[]; completions: Completion[] }

const YEAR_INFO: Record<number, { label: string; sub: string; emoji: string; color: string }> = {
  1: { label: 'Year 1 — Foundation',   sub: 'Class 9 · AI Literacy · CS50x · First Projects',   emoji: '🌱', color: '#7C6FE0' },
  2: { label: 'Year 2 — Depth',        sub: 'Class 10 · ML · Deep Learning · Live Apps',          emoji: '⚙️', color: '#64BFDF' },
  3: { label: 'Year 3 — Frontier',     sub: 'Class 11 · Agents · MCP · Research · AI Club',       emoji: '🚀', color: '#F59E6C' },
  4: { label: 'Year 4 — Legacy',       sub: 'Class 12 · Ethics · Research Paper · Portfolio',     emoji: '🏆', color: '#5EC990' },
}

export default function CurriculumClient({ userId, phases, tasks, completions }: Props) {
  const [selectedYear, setSelectedYear]   = useState<number>(1)
  const [selectedPhase, setSelectedPhase] = useState<Phase|null>(null)
  const [view, setView]                   = useState<'years'|'phases'|'phase_detail'>('years')

  const completedIds = new Set(completions.map(c => c.task_id))
  const approvedIds  = new Set(completions.filter(c => c.parent_approved).map(c => c.task_id))

  const tasksByPhase = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    if (!acc[t.phase_id]) acc[t.phase_id] = []
    acc[t.phase_id].push(t)
    return acc
  }, {})

  const phasesByYear = phases.reduce<Record<number, Phase[]>>((acc, p) => {
    if (!acc[p.year]) acc[p.year] = []
    acc[p.year].push(p)
    return acc
  }, {})

  const totalDone  = completions.length
  const totalTasks = tasks.length
  const overallPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0

  // ── PHASE DETAIL ──────────────────────────────────────────────────────────
  if (view === 'phase_detail' && selectedPhase) {
    const phaseTasks  = tasksByPhase[selectedPhase.id] ?? []
    const pDone       = phaseTasks.filter(t => completedIds.has(t.id)).length
    const pPct        = phaseTasks.length ? Math.round((pDone / phaseTasks.length) * 100) : 0
    const weekday     = phaseTasks.filter(t => t.task_type === 'weekday')
    const weekend     = phaseTasks.filter(t => t.task_type === 'weekend')

    return (
      <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', paddingBottom:32 }}>
        <div style={{ padding:'14px 16px 0' }}>
          <button onClick={() => setView('phases')} style={{ background:'none', border:'none', color:T.muted, fontSize:14, cursor:'pointer', marginBottom:12 }}>
            ← Year {selectedPhase.year}
          </button>
        </div>
        <div style={{ padding:'0 16px' }}>
          <div style={{ background:T.surface2, border:`1.5px solid ${T.purple}30`, borderRadius:16, padding:18, marginBottom:16, boxShadow:'0 2px 12px rgba(124,111,224,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:T.surface, color:T.purple, fontWeight:700, border:`1px solid ${T.border}` }}>
                {selectedPhase.badge}
              </div>
              {selectedPhase.is_active && (
                <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'#EDFBF4', color:T.mint, fontWeight:700 }}>
                  ● ACTIVE NOW
                </div>
              )}
            </div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:4 }}>
              {selectedPhase.phase_name} · Month {selectedPhase.month} · Year {selectedPhase.year}
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1.3, marginBottom:8 }}>
              {selectedPhase.label}
            </div>
            {selectedPhase.focus && (
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:12 }}>{selectedPhase.focus}</div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, color:T.muted }}>{pDone}/{phaseTasks.length} tasks done</span>
              <span style={{ fontSize:11, fontWeight:700, color:T.purple }}>{pPct}%</span>
            </div>
            <div style={{ height:6, background:T.surface, borderRadius:3 }}>
              <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${T.purple},${T.purpleL})`, width:`${pPct}%`, transition:'width 0.5s' }} />
            </div>
          </div>

          {selectedPhase.course_url && (
            <a href={selectedPhase.course_url} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:T.surface2, border:`1.5px solid ${T.border}`, borderRadius:14, textDecoration:'none', marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:22 }}>📚</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>Main Course</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.text }}>{selectedPhase.course_title}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{selectedPhase.course_url.replace('https://','').split('/')[0]} · Tap to open</div>
              </div>
              <span style={{ color:T.purple, fontSize:20 }}>→</span>
            </a>
          )}

          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <div style={{ flex:1, padding:'10px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
              <div style={{ fontSize:10, color:T.muted, marginBottom:4 }}>📅 WEEKDAYS</div>
              <div style={{ fontSize:13, color:T.text, fontWeight:600 }}>{selectedPhase.weekday_time ?? '30 min'}</div>
            </div>
            <div style={{ flex:1, padding:'10px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
              <div style={{ fontSize:10, color:T.muted, marginBottom:4 }}>🌅 WEEKENDS</div>
              <div style={{ fontSize:13, color:T.text, fontWeight:600 }}>{selectedPhase.weekend_time ?? '1 hr'}</div>
            </div>
          </div>

          {phaseTasks.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:T.muted }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
              <div style={{ fontSize:14, color:T.text }}>Tasks coming soon</div>
            </div>
          )}

          {weekday.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>📅 Mon–Fri Tasks</span>
                <span style={{ fontSize:11, color:T.muted }}>{weekday.filter(t=>completedIds.has(t.id)).length}/{weekday.length}</span>
              </div>
              {weekday.map(task => {
                const done = completedIds.has(task.id); const approved = approvedIds.has(task.id)
                return (
                  <div key={task.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', marginBottom:8,
                    background: done ? '#EDFBF4' : T.surface,
                    border:`1px solid ${approved ? T.peach+'80' : done ? T.mint+'50' : T.border}`,
                    borderRadius:12 }}>
                    <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center',
                      background: done ? T.mint : 'transparent', border:`2px solid ${done ? T.mint : T.border}` }}>
                      {done && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, color: done ? T.muted : T.text, fontWeight:600,
                        textDecoration: done ? 'line-through' : 'none', lineHeight:1.4, marginBottom:4 }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:8 }}>
                          {task.description.length > 120 ? task.description.slice(0, 120) + '…' : task.description}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:T.muted }}>⏱ {task.time_estimate}</span>
                        {task.resource_url && (
                          <a href={task.resource_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize:11, color:T.purple, textDecoration:'none', padding:'2px 8px', borderRadius:8,
                              background:T.surface2, border:`1px solid ${T.border}` }}>
                            🔗 Open Course →
                          </a>
                        )}
                        {approved && <span style={{ fontSize:10, color:T.peach, fontWeight:700 }}>✓ Approved</span>}
                        {done && !approved && <span style={{ fontSize:10, color:T.mint }}>✓ Done</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {weekend.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>🌅 Weekend Tasks</span>
                <span style={{ fontSize:11, color:T.muted }}>{weekend.filter(t=>completedIds.has(t.id)).length}/{weekend.length}</span>
              </div>
              {weekend.map(task => {
                const done = completedIds.has(task.id); const approved = approvedIds.has(task.id)
                return (
                  <div key={task.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', marginBottom:8,
                    background: done ? '#EDFBF4' : T.surface,
                    border:`1px solid ${approved ? T.peach+'80' : done ? T.mint+'50' : T.border}`,
                    borderRadius:12 }}>
                    <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center',
                      background: done ? T.mint : 'transparent', border:`2px solid ${done ? T.mint : T.border}` }}>
                      {done && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, color: done ? T.muted : T.text, fontWeight:600,
                        textDecoration: done ? 'line-through' : 'none', lineHeight:1.4, marginBottom:4 }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:8 }}>
                          {task.description.length > 120 ? task.description.slice(0, 120) + '…' : task.description}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:T.muted }}>⏱ {task.time_estimate}</span>
                        {task.resource_url && (
                          <a href={task.resource_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize:11, color:T.purple, textDecoration:'none', padding:'2px 8px', borderRadius:8,
                              background:T.surface2, border:`1px solid ${T.border}` }}>
                            🔗 Open Course →
                          </a>
                        )}
                        {approved && <span style={{ fontSize:10, color:T.peach, fontWeight:700 }}>✓ Approved</span>}
                        {done && !approved && <span style={{ fontSize:10, color:T.mint }}>✓ Done</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PHASES LIST ───────────────────────────────────────────────────────────
  if (view === 'phases') {
    const yearPhases = phasesByYear[selectedYear] ?? []
    const yearInfo   = YEAR_INFO[selectedYear]
    const yearTasks  = yearPhases.flatMap(p => tasksByPhase[p.id] ?? [])
    const yearDone   = yearTasks.filter(t => completedIds.has(t.id)).length
    const yearPct    = yearTasks.length ? Math.round((yearDone / yearTasks.length) * 100) : 0

    return (
      <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', paddingBottom:32 }}>
        <div style={{ padding:'14px 16px 0' }}>
          <button onClick={() => setView('years')} style={{ background:'none', border:'none', color:T.muted, fontSize:14, cursor:'pointer', marginBottom:12 }}>← Curriculum</button>
        </div>
        <div style={{ padding:'0 16px' }}>
          <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{yearInfo.emoji}</div>
            <div style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:'"Space Grotesk",sans-serif', marginBottom:4 }}>{yearInfo.label}</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:10 }}>{yearInfo.sub}</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, color:T.muted }}>{yearDone}/{yearTasks.length} tasks</span>
              <span style={{ fontSize:11, fontWeight:700, color:yearInfo.color }}>{yearPct}%</span>
            </div>
            <div style={{ height:6, background:T.surface, borderRadius:3 }}>
              <div style={{ height:'100%', borderRadius:3, background:yearInfo.color, width:`${yearPct}%`, transition:'width 0.5s' }} />
            </div>
          </div>

          {yearPhases.map((phase, i) => {
            const pTasks   = tasksByPhase[phase.id] ?? []
            const pDone    = pTasks.filter(t => completedIds.has(t.id)).length
            const pPct     = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0
            const isActive = phase.is_active
            return (
              <div key={phase.id}
                onClick={() => { setSelectedPhase(phase); setView('phase_detail') }}
                style={{ background: isActive ? T.surface2 : T.surface,
                  border:`1.5px solid ${isActive ? T.purple+'50' : T.border}`,
                  borderRadius:14, padding:'14px 16px', marginBottom:12, cursor:'pointer', position:'relative',
                  boxShadow: isActive ? '0 2px 10px rgba(124,111,224,0.10)' : '0 1px 4px rgba(124,111,224,0.04)' }}>
                {isActive && (
                  <div style={{ position:'absolute', top:12, right:12, fontSize:10, padding:'2px 8px', borderRadius:20, background:'#EDFBF4', color:T.mint, fontWeight:700 }}>● ACTIVE</div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:T.purple, fontWeight:800, flexShrink:0 }}>
                    {phase.phase_number ?? i+1}
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:T.muted }}>{phase.phase_name} · Month {phase.month}</div>
                    <div style={{ fontSize:10, padding:'1px 8px', borderRadius:20, background:T.surface2, color:T.purple, display:'inline-block', marginTop:2 }}>
                      {phase.badge}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color: isActive ? T.text : T.muted, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1.3, marginBottom:6 }}>
                  {phase.label}
                </div>
                {phase.course_title && (
                  <div style={{ fontSize:12, color:T.purple, marginBottom:8 }}>📚 {phase.course_title}</div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:4, background:T.surface2, borderRadius:2 }}>
                    <div style={{ height:'100%', borderRadius:2, background:T.purple, width:`${pPct}%` }} />
                  </div>
                  <span style={{ fontSize:10, color:T.muted, whiteSpace:'nowrap' }}>{pDone}/{pTasks.length} tasks</span>
                  <span style={{ color:T.muted, fontSize:16 }}>›</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── YEARS VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', paddingBottom:32 }}>
      <div style={{ padding:'16px 16px 8px' }}>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>Full Curriculum</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>4 years · 12 phases · ~780 hours · {totalDone}/{totalTasks} tasks done</div>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.muted }}>Overall Journey Progress</span>
            <span style={{ fontSize:13, fontWeight:700, color:T.purple }}>{overallPct}%</span>
          </div>
          <div style={{ height:10, background:T.surface2, borderRadius:5 }}>
            <div style={{ height:'100%', borderRadius:5, background:`linear-gradient(90deg,${T.purple},${T.mint})`, width:`${overallPct}%`, transition:'width 0.8s' }} />
          </div>
          <div style={{ marginTop:8, fontSize:11, color:T.muted }}>School always first · 4.5 hrs/week max</div>
        </div>

        {[1,2,3,4].map(yr => {
          const info       = YEAR_INFO[yr]
          const yearPhases = phasesByYear[yr] ?? []
          const yearTasks  = yearPhases.flatMap(p => tasksByPhase[p.id] ?? [])
          const yearDone   = yearTasks.filter(t => completedIds.has(t.id)).length
          const yearPct    = yearTasks.length ? Math.round((yearDone / yearTasks.length) * 100) : 0
          const hasActive  = yearPhases.some(p => p.is_active)
          const phaseCount = yearPhases.length
          return (
            <div key={yr}
              onClick={() => { setSelectedYear(yr); setView('phases') }}
              style={{ background: hasActive ? T.surface2 : T.surface,
                border:`1.5px solid ${hasActive ? T.purple+'40' : T.border}`,
                borderRadius:16, padding:'18px 16px', marginBottom:14, cursor:'pointer',
                boxShadow: hasActive ? '0 2px 12px rgba(124,111,224,0.10)' : '0 1px 6px rgba(124,111,224,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:28 }}>{info.emoji}</span>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color: hasActive ? T.text : T.muted, fontFamily:'"Space Grotesk",sans-serif' }}>{info.label}</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{info.sub}</div>
                  </div>
                </div>
                {hasActive && (
                  <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'#EDFBF4', color:T.mint, fontWeight:700, flexShrink:0 }}>● NOW</div>
                )}
              </div>
              <div style={{ display:'flex', gap:12, marginBottom:12 }}>
                <div style={{ fontSize:12, color:T.muted }}>{phaseCount} phases</div>
                <div style={{ fontSize:12, color:T.muted }}>·</div>
                <div style={{ fontSize:12, color:T.muted }}>{yearTasks.length} tasks</div>
                <div style={{ fontSize:12, color:T.muted }}>·</div>
                <div style={{ fontSize:12, color: hasActive ? info.color : T.muted, fontWeight: hasActive ? 700 : 400 }}>{yearDone} done</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:6, background:T.surface, borderRadius:3 }}>
                  <div style={{ height:'100%', borderRadius:3, background:info.color, width:`${yearPct}%`, transition:'width 0.5s' }} />
                </div>
                <span style={{ fontSize:12, color:T.muted, fontWeight:600, minWidth:36 }}>{yearPct}%</span>
                <span style={{ color:T.muted, fontSize:18 }}>›</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
