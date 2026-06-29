'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { navy2:'#0F1629', navy3:'#141B33', border:'#1E2A47', indigo:'#6C63FF', indigoL:'#8B85FF', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838', emerald:'#10B981' }

export default function ProfilePage() {
  const [profile, setProfile]   = useState<any>(null)
  const [sp, setSp]             = useState<any>(null)
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState<any>({})
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [stats, setStats]       = useState({ tasks:0, certs:0, energy:'—', journal:0 })
  const sb = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: s }, { data: tc }, { data: ec }, { data: je }] = await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).single(),
        sb.from('student_profile').select('*').eq('student_id', user.id).single(),
        sb.from('task_completions').select('id').eq('student_id', user.id),
        sb.from('certificates').select('id').eq('student_id', user.id).eq('earned', true),
        sb.from('journal_entries').select('id').eq('student_id', user.id),
      ])
      setProfile(p)
      setSp(s)
      setForm(s ?? {})
      const logs = await sb.from('energy_logs').select('score').eq('student_id', user.id).order('log_date', { ascending:false }).limit(7)
      const avg = logs.data?.length ? (logs.data.reduce((a:number,l:any)=>a+l.score,0)/logs.data.length).toFixed(1) : '—'
      setStats({ tasks:(tc??[]).length, certs:(ec??[]).length, energy:avg, journal:(je??[]).length })
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { data } = await sb.from('student_profile').upsert({ ...form, student_id: user.id, updated_at: new Date().toISOString() }, { onConflict:'student_id' }).select().single()
    if (data) setSp(data)
    setSaving(false); setSaved(true); setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const f = (k: string) => form[k] ?? ''
  const set = (k: string, v: string) => setForm((prev: any) => ({ ...prev, [k]: v }))

  const avatarEmojis = ['🎓','🚀','⚡','🧠','💡','🌟','🔬','💻','🎯','🌱']

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.white }}>My Profile</div>
          <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>Your engineering identity</div>
        </div>
        <button onClick={() => editing ? save() : setEditing(true)}
          style={{ padding:'8px 16px', background: editing ? T.indigo : T.navy2, border:`1px solid ${editing ? T.indigo : T.border}`, borderRadius:10, color: editing ? '#fff' : T.slate, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : editing ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Avatar + name */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:20, marginBottom:12, textAlign:'center' }}>
        {editing ? (
          <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            {avatarEmojis.map(e => (
              <button key={e} onClick={() => set('avatar_emoji', e)}
                style={{ width:36, height:36, borderRadius:8, border:`2px solid ${f('avatar_emoji')===e ? T.indigo : T.border}`, background:f('avatar_emoji')===e ? `${T.indigo}20` : T.navy3, fontSize:20, cursor:'pointer' }}>
                {e}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize:64, marginBottom:8 }}>{sp?.avatar_emoji ?? '🎓'}</div>
        )}
        {editing ? (
          <input value={f('display_name')} onChange={e => set('display_name', e.target.value)}
            placeholder="Your name"
            style={{ width:'100%', padding:'8px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:16, fontWeight:700, textAlign:'center', boxSizing:'border-box', marginBottom:8 }} />
        ) : (
          <div style={{ fontSize:20, fontWeight:700, color:T.white }}>{sp?.display_name ?? profile?.name ?? 'Rishona'}</div>
        )}
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{sp?.school_name ?? 'Rosary High School'} · {sp?.current_class ?? 'Class 9'}</div>
        <div style={{ fontSize:12, color:T.indigo, marginTop:2 }}>🎯 {sp?.goal_university ?? 'MIT / Stanford / Harvard'}</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
        {[
          { label:'Tasks', value:stats.tasks, color:T.emerald },
          { label:'Certs', value:stats.certs, color:T.amber },
          { label:'Energy', value:stats.energy, color:T.indigo },
          { label:'Journal', value:stats.journal, color:T.indigoL },
        ].map(s => (
          <div key={s.label} style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:700, color:s.color, fontFamily:'"Space Grotesk",sans-serif' }}>{s.value}</div>
            <div style={{ fontSize:10, color:T.slate, marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bio */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>About Me</div>
        {editing ? (
          <textarea value={f('bio')} onChange={e => set('bio', e.target.value)}
            placeholder="Write a short bio — who you are, what you are building, why…"
            rows={4}
            style={{ width:'100%', padding:'10px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', lineHeight:1.6 }} />
        ) : (
          <div style={{ fontSize:13, color:T.slate, lineHeight:1.7 }}>{sp?.bio ?? 'Tap Edit to add your bio.'}</div>
        )}
      </div>

      {/* School info */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>School & Goals</div>
        {editing ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { key:'school_name', label:'School name', placeholder:'e.g. Rosary High School' },
              { key:'current_class', label:'Current class', placeholder:'e.g. Class 9' },
              { key:'city', label:'City', placeholder:'e.g. Mumbai' },
              { key:'goal_university', label:'Dream universities', placeholder:'e.g. MIT / Stanford / Harvard' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:4 }}>{field.label}</label>
                <input value={f(field.key)} onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  style={{ width:'100%', padding:'9px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'School', value:sp?.school_name },
              { label:'Class', value:sp?.current_class },
              { label:'City', value:sp?.city ?? 'India' },
              { label:'Goal', value:sp?.goal_university },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:T.slate }}>{row.label}</span>
                <span style={{ fontSize:13, color:T.white, fontWeight:500 }}>{row.value ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div style={{ background:T.navy2, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.slate, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Links</div>
        {editing ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { key:'github_url', label:'GitHub URL', placeholder:'https://github.com/rishona' },
              { key:'linkedin_url', label:'LinkedIn URL', placeholder:'https://linkedin.com/in/rishona' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize:11, color:T.slate, display:'block', marginBottom:4 }}>{field.label}</label>
                <input value={f(field.key)} onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  style={{ width:'100%', padding:'9px 12px', background:T.navy3, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {sp?.github_url && <a href={sp.github_url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:T.indigo, textDecoration:'none' }}>🐙 {sp.github_url}</a>}
            {sp?.linkedin_url && <a href={sp.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:T.indigo, textDecoration:'none' }}>💼 {sp.linkedin_url}</a>}
            {!sp?.github_url && !sp?.linkedin_url && <div style={{ fontSize:13, color:T.slate }}>Tap Edit to add your links.</div>}
          </div>
        )}
      </div>

      {editing && (
        <div style={{ display:'flex', gap:10, marginTop:12 }}>
          <button onClick={() => setEditing(false)}
            style={{ flex:1, padding:12, background:'transparent', border:`1px solid ${T.border}`, borderRadius:10, color:T.slate, fontSize:14, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ flex:2, padding:12, background:T.indigo, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      )}
    </div>
  )
}
