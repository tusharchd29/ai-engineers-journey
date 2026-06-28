'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default function EnergyPage() {
  const [logs, setLogs]     = useState<any[]>([])
  const [score, setScore]   = useState<number | null>(null)
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [flags, setFlags]   = useState<any[]>([])
  const sb = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const since = new Date(); since.setDate(since.getDate() - 7)
      const [{ data: l }, { data: f }] = await Promise.all([
        sb.from('energy_logs').select('*').eq('student_id', user.id).gte('log_date', since.toISOString().split('T')[0]).order('log_date'),
        sb.from('burnout_flags').select('*').eq('student_id', user.id).eq('is_active', true),
      ])
      setLogs(l ?? [])
      setFlags(f ?? [])
    }
    load()
  }, [])

  const saveEnergy = async () => {
    if (!score || !userId) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await sb.from('energy_logs')
      .upsert({ student_id: userId, log_date: today, score, notes }, { onConflict: 'student_id,log_date' })
      .select().single()
    if (data) setLogs(prev => [...prev.filter(l => l.log_date !== today), data])
    // Auto burnout check
    const recent = logs.slice(-2).concat(data ? [data] : [])
    if (recent.length >= 3 && recent.every(l => l.score <= 4)) {
      await sb.from('burnout_flags').insert({ student_id: userId, flag_type: 'amber', trigger_reason: 'Energy ≤ 4 for 3 days' })
    }
    setSaving(false)
    setNotes('')
  }

  const avg = logs.length ? (logs.reduce((s,l) => s+l.score, 0) / logs.length).toFixed(1) : '—'

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>Energy Log</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>Track daily energy · Avg this week: <strong style={{ color:T.amber }}>{avg}/10</strong></div>
      </div>

      {flags.length > 0 && (
        <div style={{ marginBottom:18, padding:16, background:'#EF444415', border:'1px solid #EF444430', borderRadius:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#EF4444', marginBottom:4 }}>⚠ Burnout Flag Active</div>
          <div style={{ fontSize:12, color:T.slate }}>{flags[0]?.trigger_reason} — Please talk to Tushar or take a break from the curriculum.</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Log Today */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>How are you feeling today?</div>
          <div style={{ display:'flex', flexWrap:'wrap' as const, gap:8, marginBottom:16 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => setScore(n)} style={{
                width:40, height:40, borderRadius:8, border:`2px solid ${score===n ? (n>=7?T.emerald:n>=5?T.amber:'#EF4444') : T.border}`,
                background: score===n ? (n>=7?`${T.emerald}25`:n>=5?`${T.amber}25`:'#EF444425') : 'transparent',
                color: n>=7?T.emerald:n>=5?T.amber:'#EF4444',
                fontSize:14, fontWeight:600, cursor:'pointer',
              }}>{n}</button>
            ))}
          </div>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any notes? (optional)"
            style={{ width:'100%', padding:'10px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:13, resize:'vertical' as const, minHeight:72, boxSizing:'border-box' as const, marginBottom:12, fontFamily:'Inter,sans-serif' }}
          />
          <button onClick={saveEnergy} disabled={!score || saving} style={{
            width:'100%', padding:10, background: score ? T.emerald : T.border, border:'none', borderRadius:8,
            color:'#fff', fontSize:13, fontWeight:600, cursor: score ? 'pointer' : 'not-allowed',
          }}>
            {saving ? 'Saving…' : score ? `Log ${score}/10` : 'Select a score first'}
          </button>
        </div>

        {/* Chart */}
        <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>This Week</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:12 }}>
            {logs.slice(-7).map((log, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:'100%', borderRadius:4, height:`${(log.score/10)*72}px`, background: log.score>=7?T.emerald:log.score>=5?T.amber:'#EF4444', opacity:0.85 }} />
                <span style={{ fontSize:9, color:T.slate }}>{new Date(log.log_date).toLocaleDateString('en',{weekday:'short'})}</span>
                <span style={{ fontSize:10, fontWeight:600, color: log.score>=7?T.emerald:log.score>=5?T.amber:'#EF4444' }}>{log.score}</span>
              </div>
            ))}
            {logs.length === 0 && <div style={{ color:T.slate, fontSize:12 }}>No logs yet</div>}
          </div>
          <div style={{ padding:12, background: flags.length?'#EF444410':`${T.emerald}10`, border:`1px solid ${flags.length?'#EF444430':T.emerald+'30'}`, borderRadius:8 }}>
            <div style={{ fontSize:12, color: flags.length?'#EF4444':T.emerald, fontWeight:600 }}>
              {flags.length ? '⚠ Burnout flag active' : '✓ Healthy pace'}
            </div>
            <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>
              {flags.length ? 'Consider taking a break from curriculum.' : 'Keep it up! School always comes first.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
