'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0', purple:'#7C6FE0', text:'#2D2352', muted:'#8B82B8', peach:'#F59E6C', mint:'#5EC990', red:'#F27171' }

export default function EnergyPage() {
  const [logs, setLogs]       = useState<any[]>([])
  const [score, setScore]     = useState<number|null>(null)
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [userId, setUserId]   = useState<string|null>(null)
  const [flags, setFlags]     = useState<any[]>([])
  const sb = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const since = new Date(); since.setDate(since.getDate() - 14)
      const [{ data: l }, { data: f }] = await Promise.all([
        sb.from('energy_logs').select('*').eq('student_id', user.id).gte('log_date', since.toISOString().split('T')[0]).order('log_date'),
        sb.from('burnout_flags').select('*').eq('student_id', user.id).eq('is_active', true),
      ])
      setLogs(l ?? [])
      setFlags(f ?? [])
      const today = new Date().toISOString().split('T')[0]
      const todayLog = (l ?? []).find((x: any) => x.log_date === today)
      if (todayLog) { setScore(todayLog.score); setNotes(todayLog.notes ?? '') }
    }
    load()
  }, [])

  const saveEnergy = async () => {
    if (!score || !userId) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await sb.from('energy_logs')
      .upsert({ student_id: userId, log_date: today, score, notes: notes || null }, { onConflict: 'student_id,log_date' })
      .select().single()
    if (data) {
      setLogs(prev => [...prev.filter(l => l.log_date !== today), data].sort((a,b) => a.log_date.localeCompare(b.log_date)))
      const recent = [...logs.filter(l => l.log_date !== today), data].slice(-3)
      if (recent.length >= 3 && recent.every((l: any) => l.score <= 4)) {
        await sb.from('burnout_flags').insert({ student_id: userId, flag_type: 'amber', trigger_reason: 'Energy ≤ 4 for 3 consecutive days', is_active: true })
        setFlags(prev => [...prev, { flag_type: 'amber', trigger_reason: 'Energy ≤ 4 for 3 consecutive days' }])
      }
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const avg7 = logs.slice(-7).length
    ? (logs.slice(-7).reduce((s: number, l: any) => s + l.score, 0) / logs.slice(-7).length).toFixed(1)
    : '—'
  const today = new Date().toISOString().split('T')[0]
  const loggedToday = logs.some(l => l.log_date === today)
  const scoreColor = (s: number) => s >= 7 ? T.mint : s >= 5 ? T.peach : T.red
  const labels = ['😫','😔','😟','😕','😐','🙂','😊','😄','🤩','🔥']

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>Energy Log</div>
        <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>
          7-day avg: <strong style={{ color:T.peach }}>{avg7}/10</strong> · {logs.length} entries
        </div>
      </div>

      {flags.length > 0 && (
        <div style={{ marginBottom:16, padding:'12px 16px', background:'#FFF0F0', border:`1px solid ${T.red}40`, borderRadius:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.red, marginBottom:3 }}>⚠ Burnout Flag Active</div>
          <div style={{ fontSize:12, color:T.muted }}>{flags[0]?.trigger_reason} — Talk to Tushar or take a break.</div>
        </div>
      )}

      <div style={{ background:T.surface, border:`1px solid ${score ? scoreColor(score)+'60' : T.border}`, borderRadius:14, padding:18, marginBottom:16, boxShadow:'0 1px 8px rgba(124,111,224,0.04)' }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>
          {loggedToday ? '✓ Today logged — update?' : 'How are you feeling today?'}
        </div>
        <div style={{ fontSize:11, color:T.muted, marginBottom:14 }}>
          {new Date().toLocaleDateString('en', { weekday:'long', day:'numeric', month:'long' })}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:14 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => setScore(n)} style={{
              padding:'10px 0', borderRadius:10,
              border:`2px solid ${score===n ? scoreColor(n) : T.border}`,
              background: score===n ? `${scoreColor(n)}20` : T.surface2,
              cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            }}>
              <span style={{ fontSize:16 }}>{labels[n-1]}</span>
              <span style={{ fontSize:12, fontWeight:700, color:score===n ? scoreColor(n) : T.muted }}>{n}</span>
            </button>
          ))}
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any notes? (How was school, curriculum, mood…)"
          rows={2}
          style={{ width:'100%', padding:'10px 12px', background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', marginBottom:12 }}
        />
        <button onClick={saveEnergy} disabled={!score || saving}
          style={{ width:'100%', padding:13, background: score ? (saved ? T.mint : T.purple) : T.surface2, border:'none', borderRadius:10, color: score ? '#fff' : T.muted, fontSize:14, fontWeight:700, cursor: score ? 'pointer' : 'not-allowed' }}>
          {saved ? '✓ Saved!' : saving ? 'Saving…' : score ? `Log ${score}/10 ${labels[score-1]}` : 'Pick a score above'}
        </button>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:18, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:14 }}>Last 14 Days</div>
        {logs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:T.muted, fontSize:13 }}>No entries yet — log your first one above ↑</div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80 }}>
            {logs.slice(-14).map((log: any, i: number) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:3, background: scoreColor(log.score), opacity:0.8, height:`${(log.score/10)*70}px` }} />
                <span style={{ fontSize:9, color:T.muted }}>
                  {new Date(log.log_date).toLocaleDateString('en', { weekday:'narrow' })}
                </span>
                <span style={{ fontSize:10, fontWeight:700, color:scoreColor(log.score) }}>{log.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>Recent Entries</div>
          {[...logs].reverse().slice(0,7).map((log: any, i: number) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${scoreColor(log.score)}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:16 }}>{labels[log.score-1]}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:T.text, fontWeight:600 }}>{log.score}/10</span>
                  <span style={{ fontSize:11, color:T.muted }}>{new Date(log.log_date).toLocaleDateString('en', { day:'numeric', month:'short' })}</span>
                </div>
                {log.notes && <div style={{ fontSize:11, color:T.muted, marginTop:2, lineHeight:1.4 }}>{log.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
