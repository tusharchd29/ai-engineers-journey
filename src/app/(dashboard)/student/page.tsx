'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const T = {
  bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0',
  purple:'#7C6FE0', purpleL:'#A99EF0', text:'#2D2352', muted:'#8B82B8',
  peach:'#F59E6C', mint:'#5EC990', sky:'#64BFDF', red:'#F27171',
}

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
  const phaseColor     = activePhase?.color ?? T.purple

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:T.muted, fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>✨</div>
      <div style={{ fontSize:14 }}>Loading your dashboard…</div>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:24, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>
          {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>
          {activePhase?.phase_name ?? 'Phase 1'} · {activePhase?.badge ?? 'Explorer'}
        </div>
      </div>

      {/* Stats 2×2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'Phase Tasks',    value:`${doneTasks}/${totalTasks}`, sub:'current phase',  color:T.mint,   bg:'#EDFBF4' },
          { label:'Phase Progress', value:`${pct}%`,                   sub:'tasks completed', color:T.purple, bg:T.surface2 },
          { label:'Energy Avg',     value:avgEnergy,                   sub:'this week',       color:T.peach,  bg:'#FFF3EA' },
          { label:'Total Done',     value:`${completions.length}`,     sub:'all phases',      color:T.sky,    bg:'#EAF6FD' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Active phase card */}
      <div style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:16, padding:16, marginBottom:12, boxShadow:'0 2px 12px rgba(124,111,224,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Active Phase</div>
          <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:T.surface2, color:T.purple, fontWeight:700 }}>
            {activePhase?.badge ?? 'Explorer'}
          </div>
        </div>
        <div style={{ fontSize:16, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text, marginBottom:4, lineHeight:1.3 }}>
          {activePhase?.label ?? 'Dev Setup & AI Onboarding'}
        </div>
        {activePhase?.focus && <div style={{ fontSize:12, color:T.muted, marginBottom:10, lineHeight:1.5 }}>{activePhase.focus}</div>}
        {activePhase?.course_title && activePhase?.course_url && (
          <div style={{ marginBottom:10 }}>
            <a href={activePhase.course_url} target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:T.purple,
                textDecoration:'none', padding:'5px 12px', borderRadius:20,
                background:T.surface2, border:`1px solid ${T.border}` }}>
              📚 {activePhase.course_title} →
            </a>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:11, color:T.muted }}>Progress</span>
          <span style={{ fontSize:11, color:T.purple, fontWeight:600 }}>{pct}%</span>
        </div>
        <div style={{ height:8, background:T.surface2, borderRadius:4 }}>
          <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,${T.purple},${T.purpleL})`, width:`${pct}%`, transition:'width 0.5s' }} />
        </div>
        <div style={{ marginTop:10, fontSize:11, color:T.muted }}>
          Mon–Fri {activePhase?.weekday_time ?? '30 min'} · Sat–Sun {activePhase?.weekend_time ?? '1 hr'}
        </div>
      </div>

      {/* Today's tasks */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 8px rgba(124,111,224,0.04)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Today&apos;s Tasks</div>
          <Link href="/student/tasks" style={{ fontSize:12, color:T.purple, textDecoration:'none' }}>See all →</Link>
        </div>
        {tasks.length === 0 ? (
          <div style={{ fontSize:12, color:T.muted }}>Tap <strong style={{color:T.text}}>Tasks</strong> or <strong style={{color:T.text}}>Curriculum</strong> below to get started.</div>
        ) : tasks.slice(0, 5).map(task => {
          const done = completedSet.has(task.id)
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:2,
                background: done ? T.mint : 'transparent', border:`2px solid ${done ? T.mint : T.border}`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done && <span style={{ fontSize:11, color:'#fff' }}>✓</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color: done ? T.muted : T.text, textDecoration: done ? 'line-through' : 'none', lineHeight:1.4 }}>
                  {task.title}
                </div>
                {task.resource_url && !done && (
                  <a href={task.resource_url} target="_blank" rel="noreferrer"
                    style={{ fontSize:11, color:T.purple, textDecoration:'none', display:'block', marginTop:2 }}>🔗 Open →</a>
                )}
              </div>
              <span style={{ fontSize:10, color:T.muted, whiteSpace:'nowrap', marginTop:3 }}>{task.time_estimate}</span>
            </div>
          )
        })}
        {tasks.length > 5 && (
          <Link href="/student/tasks" style={{ display:'block', marginTop:4, fontSize:12, color:T.purple, textDecoration:'none' }}>
            +{tasks.length - 5} more tasks →
          </Link>
        )}
      </div>

      {/* Quick nav cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <Link href="/student/curriculum" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:12 }}>
          <span style={{ fontSize:22 }}>📚</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Curriculum</div>
            <div style={{ fontSize:11, color:T.muted }}>All 4 years</div>
          </div>
        </Link>
        <Link href="/student/certs" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:12 }}>
          <span style={{ fontSize:22 }}>🏆</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Certs</div>
            <div style={{ fontSize:11, color:T.muted }}>12+ target</div>
          </div>
        </Link>
      </div>

      {/* Energy chart */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Energy This Week</div>
          <Link href="/student/energy" style={{ fontSize:12, color:T.purple, textDecoration:'none' }}>Log →</Link>
        </div>
        {energyLogs.length === 0 ? (
          <div style={{ fontSize:12, color:T.muted }}>No logs yet — tap Log to record today&apos;s energy.</div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:56 }}>
            {[...energyLogs].reverse().slice(0,7).map((log, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:3, height:`${(log.score/10)*48}px`,
                  background: log.score>=7?T.mint:log.score>=5?T.peach:T.red }} />
                <span style={{ fontSize:9, color:T.muted }}>{new Date(log.log_date).toLocaleDateString('en',{weekday:'short'})}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4-Year Journey */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>4-Year Journey</div>
          <Link href="/student/curriculum" style={{ fontSize:12, color:T.purple, textDecoration:'none' }}>Explore →</Link>
        </div>
        {[
          { yr:1, label:'Foundation', sub:'AI · CS50x · First Projects', color:T.purple },
          { yr:2, label:'Depth',      sub:'ML · Deep Learning · Live Apps', color:T.sky },
          { yr:3, label:'Frontier',   sub:'Agents · MCP · AI Club', color:T.peach },
          { yr:4, label:'Legacy',     sub:'Ethics · Research · Portfolio', color:T.mint },
        ].map(yr => {
          const active = allPhases.filter(p => p.year === yr.yr).some(p => p.is_active)
          return (
            <div key={yr.yr} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background: active ? yr.color : T.border }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight: active ? 600 : 400, color: active ? T.text : T.muted }}>Year {yr.yr} — {yr.label}</div>
                <div style={{ fontSize:11, color: active ? yr.color : T.muted }}>{active ? '● ACTIVE NOW' : yr.sub}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
