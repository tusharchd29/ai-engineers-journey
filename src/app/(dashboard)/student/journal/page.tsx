'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0', purple:'#7C6FE0', purpleL:'#A99EF0', text:'#2D2352', muted:'#8B82B8', peach:'#F59E6C', mint:'#5EC990' }

const MOODS = [
  { key:'great', label:'Great', emoji:'🤩', color:'#5EC990' },
  { key:'good',  label:'Good',  emoji:'😊', color:'#7C6FE0' },
  { key:'okay',  label:'Okay',  emoji:'😐', color:'#8B82B8' },
  { key:'tough', label:'Tough', emoji:'😔', color:'#F59E6C' },
  { key:'hard',  label:'Hard',  emoji:'😟', color:'#F27171' },
]

const PROMPTS = [
  'What did I learn today?',
  'What am I proud of this week?',
  'What was hard, and how did I push through?',
  'What question do I still want to answer?',
  'What would I tell a younger me about today?',
  'What does being an engineer mean to me right now?',
]

export default function JournalPage() {
  const [entries, setEntries]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [writing, setWriting]   = useState(false)
  const [viewing, setViewing]   = useState<any>(null)
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [mood, setMood]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [userId, setUserId]     = useState<string|null>(null)
  const [prompt, setPrompt]     = useState('')
  const sb = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await sb.from('journal_entries').select('*').eq('student_id', user.id).order('created_at', { ascending:false })
      setEntries(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const newEntry = () => {
    setTitle(''); setContent(''); setMood('')
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
    setWriting(true)
  }

  const save = async () => {
    if (!content.trim() || !userId) return
    setSaving(true)
    const { data } = await sb.from('journal_entries').insert({
      student_id: userId,
      title: title.trim() || null,
      content: content.trim(),
      mood: mood || null,
      entry_date: new Date().toISOString().split('T')[0],
    }).select().single()
    if (data) setEntries(prev => [data, ...prev])
    setSaving(false); setWriting(false)
  }

  const moodOf = (key: string) => MOODS.find(m => m.key === key)

  if (loading) return <div style={{ padding:32, color:T.muted, textAlign:'center' }}>Loading journal…</div>

  if (writing) return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:700, color:T.text }}>New Entry</div>
        <button onClick={() => setWriting(false)} style={{ background:'transparent', border:'none', color:T.muted, fontSize:14, cursor:'pointer' }}>✕ Cancel</button>
      </div>
      <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:T.purple, fontStyle:'italic' }}>
        💭 {prompt}
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Title (optional)"
        style={{ width:'100%', padding:'10px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:15, fontWeight:600, boxSizing:'border-box', marginBottom:10, fontFamily:'"Space Grotesk",sans-serif' }} />
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {MOODS.map(m => (
          <button key={m.key} onClick={() => setMood(m.key)} style={{
            flex:1, padding:'8px 0', borderRadius:10, border:`2px solid ${mood===m.key ? m.color : T.border}`,
            background: mood===m.key ? `${m.color}20` : T.surface,
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
          }}>
            <span style={{ fontSize:18 }}>{m.emoji}</span>
            <span style={{ fontSize:9, color: mood===m.key ? m.color : T.muted }}>{m.label}</span>
          </button>
        ))}
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value)}
        placeholder="Write freely — no one is grading this. This is for you."
        rows={10}
        style={{ width:'100%', padding:'12px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, color:T.text, fontSize:14, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', lineHeight:1.8, marginBottom:12 }} />
      <button onClick={save} disabled={!content.trim() || saving}
        style={{ width:'100%', padding:14, background: content.trim() ? T.purple : T.surface2, border:'none', borderRadius:12, color: content.trim() ? '#fff' : T.muted, fontSize:14, fontWeight:700, cursor: content.trim() ? 'pointer' : 'not-allowed' }}>
        {saving ? 'Saving…' : '✓ Save Entry'}
      </button>
    </div>
  )

  if (viewing) return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <button onClick={() => setViewing(null)} style={{ background:'transparent', border:'none', color:T.muted, fontSize:14, cursor:'pointer' }}>← Back</button>
        <div style={{ fontSize:11, color:T.muted }}>{new Date(viewing.entry_date).toLocaleDateString('en', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
      </div>
      {viewing.mood && (() => { const m = moodOf(viewing.mood); return m ? <div style={{ fontSize:28, marginBottom:8 }}>{m.emoji} <span style={{ fontSize:13, color:m.color }}>{m.label}</span></div> : null })()}
      {viewing.title && <div style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:'"Space Grotesk",sans-serif', marginBottom:12 }}>{viewing.title}</div>}
      <div style={{ fontSize:14, color:T.text, lineHeight:1.9, whiteSpace:'pre-wrap' }}>{viewing.content}</div>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>Journal</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{entries.length} entries</div>
        </div>
        <button onClick={newEntry}
          style={{ padding:'10px 16px', background:T.purple, border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + Write
        </button>
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:T.muted }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📓</div>
          <div style={{ fontSize:16, fontWeight:600, color:T.text, marginBottom:8 }}>Your journal is empty</div>
          <div style={{ fontSize:13, marginBottom:20 }}>Write your first entry — even a single sentence counts.</div>
          <button onClick={newEntry}
            style={{ padding:'12px 24px', background:T.purple, border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Start Writing →
          </button>
        </div>
      ) : entries.map(entry => {
        const m = moodOf(entry.mood)
        return (
          <div key={entry.id} onClick={() => setViewing(entry)}
            style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:10, cursor:'pointer', boxShadow:'0 1px 6px rgba(124,111,224,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ flex:1, paddingRight:8 }}>
                <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:2 }}>
                  {entry.title || new Date(entry.entry_date).toLocaleDateString('en', { weekday:'long', day:'numeric', month:'short' })}
                </div>
                <div style={{ fontSize:11, color:T.muted }}>{new Date(entry.entry_date).toLocaleDateString('en', { day:'numeric', month:'short', year:'numeric' })}</div>
              </div>
              {m && <span style={{ fontSize:20 }}>{m.emoji}</span>}
            </div>
            <div style={{ fontSize:13, color:T.muted, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
              {entry.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
