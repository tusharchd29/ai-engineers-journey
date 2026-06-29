import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const T = { surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0', purple:'#7C6FE0', text:'#2D2352', muted:'#8B82B8', peach:'#F59E6C', mint:'#5EC990', sky:'#64BFDF', red:'#F27171' }

export default async function ParentDashboard() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await sb.from('profiles').select('*').eq('role', 'student')
  const student = students?.[0] ?? null
  const sid = student?.id ?? null

  const [
    { data: completions },
    { data: energyLogs },
    { data: burnoutFlags },
    { data: pending },
    { data: phases },
    { data: certs },
  ] = await Promise.all([
    sid ? sb.from('task_completions').select('*').eq('student_id', sid) : { data: [] },
    sid ? sb.from('energy_logs').select('*').eq('student_id', sid).order('log_date', { ascending:false }).limit(7) : { data: [] },
    sid ? sb.from('burnout_flags').select('*').eq('student_id', sid).eq('is_active', true) : { data: [] },
    sid ? sb.from('task_completions').select('*, tasks(title,time_estimate)').eq('student_id', sid).eq('parent_approved', false).order('completed_at', { ascending:false }).limit(5) : { data: [] },
    sb.from('phases').select('*').eq('is_active', true).limit(1),
    sid ? sb.from('certificates').select('*').eq('student_id', sid).eq('earned', true) : { data: [] },
  ])

  const safeC    = completions  ?? []
  const safeLogs = energyLogs   ?? []
  const safeFlags = burnoutFlags ?? []
  const safePend  = pending     ?? []
  const currentPhase = (phases ?? [])[0]
  const earnedCerts  = (certs ?? []).length

  const avgEnergy = safeLogs.length
    ? (safeLogs.reduce((s: number, l: any) => s + l.score, 0) / safeLogs.length).toFixed(1)
    : '—'

  const scoreColor = (s: number) => s >= 7 ? T.mint : s >= 5 ? T.peach : T.red

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>
          {student?.name ?? 'Student'}&apos;s Journey
        </div>
        <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>
          {currentPhase?.label ?? 'Phase 1'} · {safeFlags.length > 0 ? '⚠ Needs attention' : '✓ All good'}
        </div>
      </div>

      {safeFlags.length > 0 && (
        <div style={{ marginBottom:16, padding:'12px 16px', background:'#FFF0F0', border:`1px solid ${T.red}40`, borderRadius:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:3 }}>⚠ Burnout Flag Active</div>
          <div style={{ fontSize:12, color:T.muted }}>{(safeFlags[0] as any)?.trigger_reason}</div>
          <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Consider pausing curriculum and having a conversation first.</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'Tasks Done',   value: safeC.length,        color:T.mint,  bg:'#EDFBF4' },
          { label:'Pending',      value: safePend.length,     color: safePend.length > 0 ? T.peach : T.mint, bg: safePend.length > 0 ? '#FFF3EA' : '#EDFBF4' },
          { label:'Energy Avg',   value: avgEnergy,           color:T.purple, bg:T.surface2 },
          { label:'Certs Earned', value: earnedCerts,         color:T.peach,  bg:'#FFF3EA' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif', lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.surface, border:`1px solid ${safePend.length > 0 ? T.peach+'60' : T.border}`, borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 8px rgba(124,111,224,0.04)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Pending Approvals</div>
          {safePend.length > 0
            ? <Link href="/parent/approve" style={{ fontSize:12, color:T.peach, textDecoration:'none', fontWeight:600 }}>Review all →</Link>
            : <span style={{ fontSize:12, color:T.mint }}>✓ All clear</span>
          }
        </div>
        {safePend.length === 0 ? (
          <div style={{ fontSize:13, color:T.muted, textAlign:'center', padding:'12px 0' }}>Nothing waiting for approval</div>
        ) : (safePend as any[]).slice(0, 3).map((item: any) => (
          <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:T.surface2, borderRadius:10, marginBottom:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:T.peach, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:T.text, fontWeight:500 }}>{item.tasks?.title ?? 'Task'}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{new Date(item.completed_at).toLocaleDateString('en', { day:'numeric', month:'short' })}</div>
            </div>
          </div>
        ))}
        {safePend.length > 3 && (
          <Link href="/parent/approve" style={{ display:'block', textAlign:'center', fontSize:12, color:T.peach, textDecoration:'none', marginTop:4 }}>
            +{safePend.length - 3} more waiting →
          </Link>
        )}
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Energy This Week</div>
          <span style={{ fontSize:12, color: parseFloat(avgEnergy) >= 7 ? T.mint : T.peach }}>avg {avgEnergy}/10</span>
        </div>
        {safeLogs.length === 0 ? (
          <div style={{ fontSize:12, color:T.muted, textAlign:'center', padding:'12px 0' }}>No energy logs yet</div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:64 }}>
            {[...safeLogs].reverse().slice(0,7).map((log: any, i: number) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:3, background:scoreColor(log.score), opacity:0.8, height:`${(log.score/10)*56}px` }} />
                <span style={{ fontSize:9, color:T.muted }}>{new Date(log.log_date).toLocaleDateString('en', { weekday:'narrow' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentPhase && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:10 }}>Active Phase</div>
          <div style={{ display:'inline-block', fontSize:10, padding:'2px 8px', borderRadius:20, background:T.surface2, color:T.purple, marginBottom:8 }}>{currentPhase.badge}</div>
          <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>{currentPhase.label}</div>
          <div style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>{currentPhase.focus}</div>
          <div style={{ marginTop:10, fontSize:11, color:T.muted }}>
            Mon–Fri {currentPhase.weekday_time} · Sat–Sun {currentPhase.weekend_time}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[
          { href:'/parent/approve',   label:'Review Tasks',  emoji:'✅', color:T.peach,  bg:'#FFF3EA' },
          { href:'/parent/progress',  label:'Full Progress', emoji:'📈', color:T.purple, bg:T.surface2 },
          { href:'/parent/wellbeing', label:'Wellbeing',     emoji:'💚', color:T.mint,   bg:'#EDFBF4' },
        ].map(l => (
          <Link key={l.href} href={l.href} style={{
            display:'flex', alignItems:'center', gap:10, padding:'14px 16px',
            background:l.bg, border:`1px solid ${T.border}`,
            borderRadius:12, textDecoration:'none',
          }}>
            <span style={{ fontSize:20 }}>{l.emoji}</span>
            <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
