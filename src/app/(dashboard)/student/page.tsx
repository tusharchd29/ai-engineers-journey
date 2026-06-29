'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const T = { bg:'#0A0F1E', navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default function StudentDashboard() {
  const [loading, setLoading]       = useState(true)
  const [profile, setProfile]       = useState<any>(null)
  const [activePhase, setPhase]     = useState<any>(null)
  const [tasks, setTasks]           = useState<any[]>([])
  const [completions, setCompletions] = useState<any[]>([])
  const [energyLogs, setEnergy]     = useState<any[]>([])
  const [allPhases, setAllPhases]   = useState<any[]>([])

  useEffect(() => {
    const sb = createClient()
    const load = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const [
        { data: prof },
        { data: phases },
        { data: comps },
        { data: energy },
        { data: all },
      ] = await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).single(),
        sb.from('phases').select('*').eq('is_active', true).order('year').order('month').limit(1),
        sb.from('task_completions').select('task_id, parent_approved').eq('student_id', user.id),
        sb.from('energy_logs').select('*').eq('student_id', user.id).order('log_date', { ascending: false }).limit(7),
        sb.from('phases').select('id, year, is_active').order('year').order('month'),
      ])

      const phase = phases?.[0] ?? null
      setProfile(prof)
      setPhase(phase)
      setCompletions(comps ?? [])
      setEnergy(energy ?? [])
      setAllPhases(all ?? [])

      if (phase) {
        const { data: t } = await sb.from('tasks').select('*').eq('phase_id', phase.id).order('task_order')
        setTasks(t ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const completedSet   = new Set(completions.map(c => c.task_id))
  const doneTasks      = tasks.filter(t => completedSet.has(t.id)).length
  const totalTasks     = tasks.length
  const pct            = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const avgEnergy      = energyLogs.length
    ? (energyLogs.reduce((s, l) => s + l.score, 0) / energyLogs.length).toFixed(1) : '—'
  const firstName      = profile?.name?.split(' ')[0] ?? 'Rishona'
  const hour           = new Date().getHours()
  const greeting       = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const phaseColor     = activePhase?.color ?? T.indigo

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:T.slate, fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:14 }}>Loading your dashboard…</div>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:24, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>
          {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>
          {activePhase?.phase_name ?? 'Phase 1'} · {activePhase?.badge ?? 'Explorer'}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'Phase Tasks',    value:`${doneTasks}/${totalTasks}`, sub:'current phase',  color:T.emerald },
          { label:'Phase Progress', value:`${pct}%`,                   sub:'tasks completed', color:T.indigo  },
          { label:'Energy Avg',     value:avgEnergy,                   sub:'this week',       color:T.amber   },
          { label:'Total Done',     value:`${completions.length}`,     sub:'all phases',      color:T.indigoL },
        ].map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:T.slate, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:`${phaseColor}10`, border:`1px solid ${phaseColor}35`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Active Phase</div>
          <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${phaseColor}20`, color:phaseColor }}>
            {activePhase?.badge ?? 'Explorer'}
          </div>
        </div>
        <div style={{ fontSize:16, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white, marginBottom:4, lineHeight:1.3 }}>
          {activePhase?.label ?? 'Dev Setup & AI Onboarding'}
        </div>
        {activePhase?.focus && <div style={{ fontSize:12, color:T.slate, marginBottom:10, lineHeight:1.5 }}>{activePhase.focus}</div>}
        {activePhase?.course_title && activePhase?.course_url && (
          <div style={{ marginBottom:10 }}>
            <a href={activePhase.course_url} target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:phaseColor,
                textDecoration:'none', padding:'5px 12px', borderRadius:20,
                background:`${phaseColor}15`, border:`1px solid ${phaseColor}30` }}>
              📚 {activePhase.course_title} →
            </a>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:11, color:T.slate }}>Progress</span>
          <span style={{ fontSize:11, color:phaseColor, fontWeight:600 }}>{pct}%</span>
        </div>
        <div style={{ height:6, background:T.navy3, borderRadius:3 }}>
          <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${phaseColor},${T.indigoL})`, width:`${pct}%`, transition:'width 0.5s' }} />
        </div>
        <div style={{ marginTop:10, fontSize:11, color:T.slate }}>
          Mon–Fri {activePhase?.weekday_time ?? '30 min'} · Sat–Sun {activePhase?.weekend_time ?? '1 hr'}
        </div>
      </div>

      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Today&apos;s Tasks</div>
          <Link href="/student/tasks" style={{ fontSize:12, color:T.indigo, textDecoration:'none' }}>See all →</Link>
        </div>
        {tasks.length === 0 ? (
          <div style={{ fontSize:12, color:T.slate }}>Tap <strong style={{color:T.white}}>Tasks</strong> or <strong style={{color:T.white}}>Curriculum</strong> below to get started.</div>
        ) : tasks.slice(0, 5).map(task => {
          const done = completedSet.has(task.id)
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:2,
                background: done ? T.emerald : 'transparent', border:`2px solid ${done ? T.emerald : T.border}`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done && <span style={{ fontSize:11, color:'#fff' }}>✓</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color: done ? T.slate : T.white, textDecoration: done ? 'line-through' : 'none', lineHeight:1.4 }}>
                  {task.title}
                </div>
                {task.resource_url && !done && (
                  <a href={task.resource_url} target="_blank" rel="noreferrer"
                    style={{ fontSize:11, color:T.indigo, textDecoration:'none', display:'block', marginTop:2 }}>🔗 Open →</a>
                )}
              </div>
              <span style={{ fontSize:10, color:T.slate, whiteSpace:'nowrap', marginTop:3 }}>{task.time_estimate}</span>
            </div>
          )
        })}
        {tasks.length > 5 && (
          <Link href="/student/tasks" style={{ display:'block', marginTop:4, fontSize:12, color:T.indigo, textDecoration:'none' }}>
            +{tasks.length - 5} more tasks →
          </Link>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <Link href="/student/curriculum" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12 }}>
          <span style={{ fontSize:22 }}>📚</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Curriculum</div>
            <div style={{ fontSize:11, color:T.slate }}>All 4 years</div>
          </div>
        </Link>
        <Link href="/student/certs" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:T.navy2, border:`1px solid ${T.border}`, borderRadius:12 }}>
          <span style={{ fontSize:22 }}>🏆</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Certs</div>
            <div style={{ fontSize:11, color:T.slate }}>12+ target</div>
          </div>
        </Link>
      </div>

      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>Energy This Week</div>
          <Link href="/student/energy" style={{ fontSize:12, color:T.indigo, textDecoration:'none' }}>Log →</Link>
        </div>
        {energyLogs.length === 0 ? (
          <div style={{ fontSize:12, color:T.slate }}>No logs yet — tap Log to record today&apos;s energy.</div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:56 }}>
            {[...energyLogs].reverse().slice(0,7).map((log, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:3, height:`${(log.score/10)*48}px`,
                  background: log.score>=7?T.emerald:log.score>=5?T.amber:'#EF4444' }} />
                <span style={{ fontSize:9, color:T.slate }}>{new Date(log.log_date).toLocaleDateString('en',{weekday:'short'})}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>4-Year Journey</div>
          <Link href="/student/curriculum" style={{ fontSize:12, color:T.indigo, textDecoration:'none' }}>Explore →</Link>
        </div>
        {[
          { yr:1, label:'Foundation', sub:'AI · CS50x · First Projects', color:T.indigo },
          { yr:2, label:'Depth',      sub:'ML · Deep Learning · Live Apps', color:'#0F7173' },
          { yr:3, label:'Frontier',   sub:'Agents · MCP · AI Club', color:T.amber },
          { yr:4, label:'Legacy',     sub:'Ethics · Research · Portfolio', color:T.emerald },
        ].map(yr => {
          const active = allPhases.filter(p => p.year === yr.yr).some(p => p.is_active)
          return (
            <div key={yr.yr} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background: active ? yr.color : T.border }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight: active ? 600 : 400, color: active ? T.white : T.slate }}>Year {yr.yr} — {yr.label}</div>
                <div style={{ fontSize:11, color: active ? yr.color : T.slate }}>{active ? '● ACTIVE NOW' : yr.sub}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
