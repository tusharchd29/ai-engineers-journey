'use client'
import { useState } from 'react'

const T = {
  bg:'#0A0F1E', navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47',
  indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC',
  amber:'#E8A838', emerald:'#10B981', red:'#EF4444'
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

interface Props {
  userId: string
  phases: Phase[]
  tasks: Task[]
  completions: Completion[]
}

const YEAR_INFO: Record<number, { label: string; sub: string; emoji: string; color: string }> = {
  1: { label: 'Year 1 — Foundation',   sub: 'Class 9 · AI Literacy · CS50x · First Projects',   emoji: '🌱', color: '#6C63FF' },
  2: { label: 'Year 2 — Depth',        sub: 'Class 10 · ML · Deep Learning · Live Apps',          emoji: '⚙️', color: '#0F7173' },
  3: { label: 'Year 3 — Frontier',     sub: 'Class 11 · Agents · MCP · Research · AI Club',       emoji: '🚀', color: '#E8A838' },
  4: { label: 'Year 4 — Legacy',       sub: 'Class 12 · Ethics · Research Paper · Portfolio',     emoji: '🏆', color: '#10B981' },
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

  // ── PHASE DETAIL VIEW ─────────────────────────────────────────────────────
  if (view === 'phase_detail' && selectedPhase) {
    const phaseTasks  = tasksByPhase[selectedPhase.id] ?? []
    const pDone       = phaseTasks.filter(t => completedIds.has(t.id)).length
    const pPct        = phaseTasks.length ? Math.round((pDone / phaseTasks.length) * 100) : 0
    const weekday     = phaseTasks.filter(t => t.task_type === 'weekday')
    const weekend     = phaseTasks.filter(t => t.task_type === 'weekend')
    const phaseColor  = selectedPhase.color ?? T.indigo

    return (
      <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', paddingBottom:32 }}>
        {/* Back bar */}
        <div style={{ padding:'14px 16px 0' }}>
          <button onClick={() => { setView('phases') }}
            style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:12 }}>
            ← Year {selectedPhase.year}
          </button>
        </div>

        <div style={{ padding:'0 16px' }}>
          {/* Phase header */}
          <div style={{ background:`${phaseColor}12`, border:`1px solid ${phaseColor}40`, borderRadius:16, padding:18, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${phaseColor}25`, color:phaseColor, fontWeight:700 }}>
                {selectedPhase.badge}
              </div>
              {selectedPhase.is_active && (
                <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${T.emerald}20`, color:T.emerald, fontWeight:700 }}>
                  ● ACTIVE NOW
                </div>
              )}
            </div>
            <div style={{ fontSize:12, color:T.slate, marginBottom:4 }}>
              {selectedPhase.phase_name} · Month {selectedPhase.month} · Year {selectedPhase.year}
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1.3, marginBottom:8 }}>
              {selectedPhase.label}
            </div>
            {selectedPhase.focus && (
              <div style={{ fontSize:13, color:T.slate, lineHeight:1.6, marginBottom:12 }}>{selectedPhase.focus}</div>
            )}
            {/* Progress */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, color:T.slate }}>{pDone}/{phaseTasks.length} tasks done</span>
              <span style={{ fontSize:11, fontWeight:700, color:phaseColor }}>{pPct}%</span>
            </div>
            <div style={{ height:6, background:T.navy3, borderRadius:3 }}>
              <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${phaseColor},${T.indigoL})`, width:`${pPct}%`, transition:'width 0.5s' }} />
            </div>
          </div>

          {/* Main course link */}
          {selectedPhase.course_url && (
            <a href={selectedPhase.course_url} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:`${phaseColor}10`, border:`1.5px solid ${phaseColor}40`, borderRadius:14, textDecoration:'none', marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${phaseColor}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:22 }}>📚</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:phaseColor, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>Main Course</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{selectedPhase.course_title}</div>
                <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{selectedPhase.course_url.replace('https://','').split('/')[0]} · Tap to open</div>
              </div>
              <span style={{ color:phaseColor, fontSize:20 }}>→</span>
            </a>
          )}

          {/* Schedule info */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <div style={{ flex:1, padding:'10px 14px', background:T.navy2, border:`1px solid ${T.border}`, borderRadius:10 }}>
              <div style={{ fontSize:10, color:T.slate, marginBottom:4 }}>📅 WEEKDAYS</div>
              <div style={{ fontSize:13, color:T.white, fontWeight:600 }}>{selectedPhase.weekday_time ?? '30 min'}</div>
            </div>
            <div style={{ flex:1, padding:'10px 14px', background:T.navy2, border:`1px solid ${T.border}`, borderRadius:10 }}>
              <div style={{ fontSize:10, color:T.slate, marginBottom:4 }}>🌅 WEEKENDS</div>
              <div style={{ fontSize:13, color:T.white, fontWeight:600 }}>{selectedPhase.weekend_time ?? '1 hr'}</div>
            </div>
          </div>

          {phaseTasks.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:T.slate }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
              <div style={{ fontSize:14, color:T.white }}>Tasks coming soon</div>
            </div>
          )}

          {/* Weekday tasks */}
          {weekday.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>📅 Mon–Fri Tasks</span>
                <span style={{ fontSize:11, color:T.slate }}>{weekday.filter(t=>completedIds.has(t.id)).length}/{weekday.length}</span>
              </div>
              {weekday.map(task => {
                const done     = completedIds.has(task.id)
                const approved = approvedIds.has(task.id)
                return (
                  <div key={task.id}
                    style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', marginBottom:8,
                      background: done ? `${T.emerald}08` : T.navy2,
                      border:`1px solid ${approved ? T.amber+'60' : done ? T.emerald+'30' : T.border}`,
                      borderRadius:12 }}>
                    <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center',
                      background: done ? T.emerald : 'transparent', border:`2px solid ${done ? T.emerald : T.border}` }}>
                      {done && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, color: done ? T.slate : T.white, fontWeight:600,
                        textDecoration: done ? 'line-through' : 'none', lineHeight:1.4, marginBottom:4 }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize:12, color:T.slate, lineHeight:1.6, marginBottom:8 }}>
                          {task.description.length > 120 ? task.description.slice(0, 120) + '…' : task.description}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:T.slate }}>⏱ {task.time_estimate}</span>
                        {task.resource_url && (
                          <a href={task.resource_url} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize:11, color:T.indigo, textDecoration:'none', padding:'2px 8px', borderRadius:8,
                              background:`${T.indigo}15`, border:`1px solid ${T.indigo}30` }}>
                            🔗 Open Course →
                          </a>
                        )}
                        {approved && <span style={{ fontSize:10, color:T.amber, fontWeight:700 }}>✓ Approved</span>}
                        {done && !approved && <span style={{ fontSize:10, color:T.emerald }}>✓ Done</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Weekend tasks */}
          {weekend.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:11, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>🌅 Weekend Tasks</span>
                <span style={{ fontSize:11, color:T.slate }}>{weekend.filter(t=>completedIds.has(t.id)).length}/{weekend.length}</span>
              </div>
              {weekend.map(task => {
                const done     = completedIds.has(task.id)
                const approved = approvedIds.has(task.id)
                return (
                  <div key={task.id}
                    style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', marginBottom:8,
                      background: done ? `${T.emerald}08` : T.navy2,
                      border:`1px solid ${approved ? T.amber+'60' : done ? T.emerald+'30' : T.border}`,
                      borderRadius:12 }}>
                    <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center',
                      background: done ? T.emerald : 'transparent', border:`2px solid ${done ? T.emerald : T.border}` }}>
                      {done && <span style={{ fontSize:13, color:'#fff' }}>✓</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, color: done ? T.slate : T.white, fontWeight:600,
                        textDecoration: done ? 'line-through' : 'none', lineHeight:1.4, marginBottom:4 }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize:12, color:T.slate, lineHeight:1.6, marginBottom:8 }}>
                          {task.description.length > 120 ? task.description.slice(0, 120) + '…' : task.description}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:T.slate }}>⏱ {task.time_estimate}</span>
                        {task.resource_url && (
                          <a href={task.resource_url} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize:11, color:T.indigo, textDecoration:'none', padding:'2px 8px', borderRadius:8,
                              background:`${T.indigo}15`, border:`1px solid ${T.indigo}30` }}>
                            🔗 Open Course →
                          </a>
                        )}
                        {approved && <span style={{ fontSize:10, color:T.amber, fontWeight:700 }}>✓ Approved</span>}
                        {done && !approved && <span style={{ fontSize:10, color:T.emerald }}>✓ Done</span>}
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

  // ── PHASES LIST (one year) ────────────────────────────────────────────────
  if (view === 'phases') {
    const yearPhases = phasesByYear[selectedYear] ?? []
    const yearInfo   = YEAR_INFO[selectedYear]
    const yearTasks  = yearPhases.flatMap(p => tasksByPhase[p.id] ?? [])
    const yearDone   = yearTasks.filter(t => completedIds.has(t.id)).length
    const yearPct    = yearTasks.length ? Math.round((yearDone / yearTasks.length) * 100) : 0

    return (
      <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', paddingBottom:32 }}>
        <div style={{ padding:'14px 16px 0' }}>
          <button onClick={() => setView('years')}
            style={{ background:'none', border:'none', color:T.slate, fontSize:14, cursor:'pointer', marginBottom:12 }}>
            ← Curriculum
          </button>
        </div>
        <div style={{ padding:'0 16px' }}>
          {/* Year header */}
          <div style={{ background:`${yearInfo.color}10`, border:`1px solid ${yearInfo.color}30`, borderRadius:16, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{yearInfo.emoji}</div>
            <div style={{ fontSize:20, fontWeight:700, color:T.white, fontFamily:'"Space Grotesk",sans-serif', marginBottom:4 }}>{yearInfo.label}</div>
            <div style={{ fontSize:13, color:T.slate, marginBottom:10 }}>{yearInfo.sub}</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, color:T.slate }}>{yearDone}/{yearTasks.length} tasks</span>
              <span style={{ fontSize:11, fontWeight:700, color:yearInfo.color }}>{yearPct}%</span>
            </div>
            <div style={{ height:6, background:T.navy3, borderRadius:3 }}>
              <div style={{ height:'100%', borderRadius:3, background:yearInfo.color, width:`${yearPct}%`, transition:'width 0.5s' }} />
            </div>
          </div>

          {/* Phase cards */}
          {yearPhases.map((phase, i) => {
            const pTasks   = tasksByPhase[phase.id] ?? []
            const pDone    = pTasks.filter(t => completedIds.has(t.id)).length
            const pPct     = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0
            const pColor   = phase.color ?? T.indigo
            const isActive = phase.is_active

            return (
              <div key={phase.id}
                onClick={() => { setSelectedPhase(phase); setView('phase_detail') }}
                style={{ background: isActive ? `${pColor}12` : T.navy2,
                  border:`1px solid ${isActive ? pColor+'50' : T.border}`,
                  borderRadius:14, padding:'14px 16px', marginBottom:12, cursor:'pointer', position:'relative' }}>
                {isActive && (
                  <div style={{ position:'absolute', top:12, right:12, fontSize:10, padding:'2px 8px', borderRadius:20,
                    background:`${T.emerald}20`, color:T.emerald, fontWeight:700 }}>● ACTIVE</div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:`${pColor}20`, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:13, color:pColor, fontWeight:800, flexShrink:0 }}>
                    {phase.phase_number ?? i+1}
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:T.slate }}>{phase.phase_name} · Month {phase.month}</div>
                    <div style={{ fontSize:10, padding:'1px 8px', borderRadius:20, background:`${pColor}15`, color:pColor, display:'inline-block', marginTop:2 }}>
                      {phase.badge}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color: isActive ? T.white : T.slate,
                  fontFamily:'"Space Grotesk",sans-serif', lineHeight:1.3, marginBottom:6 }}>
                  {phase.label}
                </div>
                {phase.course_title && (
                  <div style={{ fontSize:12, color:T.indigo, marginBottom:8 }}>📚 {phase.course_title}</div>
                )}
                {/* Mini progress */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:4, background:T.navy3, borderRadius:2 }}>
                    <div style={{ height:'100%', borderRadius:2, background:pColor, width:`${pPct}%` }} />
                  </div>
                  <span style={{ fontSize:10, color:T.slate, whiteSpace:'nowrap' }}>{pDone}/{pTasks.length} tasks</span>
                  <span style={{ color:T.slate, fontSize:16 }}>›</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── YEARS VIEW (home) ─────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:'Inter,sans-serif', background:T.bg, minHeight:'100vh', paddingBottom:32 }}>
      <div style={{ padding:'16px 16px 8px' }}>
        {/* Header */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>Full Curriculum</div>
          <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>4 years · 12 phases · ~780 hours · {totalDone}/{totalTasks} tasks done</div>
        </div>

        {/* Overall progress */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.slate }}>Overall Journey Progress</span>
            <span style={{ fontSize:13, fontWeight:700, color:T.indigo }}>{overallPct}%</span>
          </div>
          <div style={{ height:10, background:T.navy3, borderRadius:5 }}>
            <div style={{ height:'100%', borderRadius:5, background:`linear-gradient(90deg,${T.indigo},${T.emerald})`, width:`${overallPct}%`, transition:'width 0.8s' }} />
          </div>
          <div style={{ marginTop:8, fontSize:11, color:T.slate }}>School always first · 4.5 hrs/week max</div>
        </div>

        {/* Year cards */}
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
              style={{ background: hasActive ? `${info.color}10` : T.navy2,
                border:`1.5px solid ${hasActive ? info.color+'50' : T.border}`,
                borderRadius:16, padding:'18px 16px', marginBottom:14, cursor:'pointer' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:28 }}>{info.emoji}</span>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color: hasActive ? T.white : T.slate,
                      fontFamily:'"Space Grotesk",sans-serif' }}>{info.label}</div>
                    <div style={{ fontSize:12, color:T.slate, marginTop:2 }}>{info.sub}</div>
                  </div>
                </div>
                {hasActive && (
                  <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${T.emerald}20`, color:T.emerald, fontWeight:700, flexShrink:0 }}>
                    ● NOW
                  </div>
                )}
              </div>
              {/* Stats row */}
              <div style={{ display:'flex', gap:12, marginBottom:12 }}>
                <div style={{ fontSize:12, color:T.slate }}>{phaseCount} phases</div>
                <div style={{ fontSize:12, color:T.slate }}>·</div>
                <div style={{ fontSize:12, color:T.slate }}>{yearTasks.length} tasks</div>
                <div style={{ fontSize:12, color:T.slate }}>·</div>
                <div style={{ fontSize:12, color: hasActive ? info.color : T.slate, fontWeight: hasActive ? 700 : 400 }}>
                  {yearDone} done
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:6, background:T.navy3, borderRadius:3 }}>
                  <div style={{ height:'100%', borderRadius:3, background:info.color, width:`${yearPct}%`, transition:'width 0.5s' }} />
                </div>
                <span style={{ fontSize:12, color:T.slate, fontWeight:600, minWidth:36 }}>{yearPct}%</span>
                <span style={{ color:T.slate, fontSize:18 }}>›</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
