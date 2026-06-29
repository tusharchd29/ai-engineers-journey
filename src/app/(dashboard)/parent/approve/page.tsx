'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = { bg:'#FFF8F0', surface:'#FFFFFF', surface2:'#F5F0FF', border:'#E8E0F0', purple:'#7C6FE0', text:'#2D2352', muted:'#8B82B8', peach:'#F59E6C', mint:'#5EC990', red:'#F27171' }

interface Completion {
  id: string; task_id: string; student_id: string; completed_at: string
  proof_text: string|null; proof_url: string|null; github_hash: string|null
  parent_approved: boolean; parent_notes: string|null
  tasks: { title: string; description: string; time_estimate: string }|null
}

export default function ApprovePage() {
  const [pending,  setPending]  = useState<Completion[]>([])
  const [approved, setApproved] = useState<Completion[]>([])
  const [loading,  setLoading]  = useState(true)
  const [notes,    setNotes]    = useState<Record<string,string>>({})
  const [saving,   setSaving]   = useState<Record<string,boolean>>({})
  const [expanded, setExpanded] = useState<string|null>(null)
  const sb = createClient()

  useEffect(() => {
    async function load() {
      const { data: students } = await sb.from('profiles').select('id').eq('role', 'student')
      const sid = students?.[0]?.id
      if (!sid) { setLoading(false); return }
      const [{ data: pend }, { data: appr }] = await Promise.all([
        sb.from('task_completions').select('*, tasks(title,description,time_estimate)').eq('student_id', sid).eq('parent_approved', false).order('completed_at', { ascending:false }),
        sb.from('task_completions').select('*, tasks(title,description,time_estimate)').eq('student_id', sid).eq('parent_approved', true).order('completed_at', { ascending:false }).limit(10),
      ])
      setPending((pend ?? []) as Completion[])
      setApproved((appr ?? []) as Completion[])
      setLoading(false)
    }
    load()
  }, [])

  const approve = async (id: string) => {
    setSaving(s => ({ ...s, [id]:true }))
    await sb.from('task_completions').update({ parent_approved:true, parent_approved_at: new Date().toISOString(), parent_notes: notes[id]??null }).eq('id', id)
    const item = pending.find(p => p.id === id)
    if (item) { setPending(p => p.filter(x => x.id !== id)); setApproved(a => [{ ...item, parent_approved:true }, ...a]) }
    setSaving(s => ({ ...s, [id]:false }))
  }

  const reject = async (id: string) => {
    setSaving(s => ({ ...s, [id]:true }))
    await sb.from('task_completions').delete().eq('id', id)
    setPending(p => p.filter(x => x.id !== id))
    setSaving(s => ({ ...s, [id]:false }))
  }

  if (loading) return <div style={{ padding:32, color:T.muted, textAlign:'center' }}>Loading…</div>

  return (
    <div style={{ padding:'16px 16px 8px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif', color:T.text }}>Task Approvals</div>
        <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{pending.length} pending · {approved.length} recently approved</div>
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
          Awaiting Review ({pending.length})
        </div>
        {pending.length === 0 ? (
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, textAlign:'center', boxShadow:'0 1px 8px rgba(124,111,224,0.04)' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>✅</div>
            <div style={{ fontSize:14, color:T.text, fontWeight:600 }}>All caught up!</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Nothing to review right now.</div>
          </div>
        ) : pending.map(item => {
          const isOpen = expanded === item.id
          return (
            <div key={item.id} style={{ background:T.surface, border:`1.5px solid ${T.peach}50`, borderRadius:14, marginBottom:12, overflow:'hidden', boxShadow:'0 2px 10px rgba(245,158,108,0.08)' }}>
              <div style={{ padding:'14px 16px' }} onClick={() => setExpanded(isOpen ? null : item.id)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, paddingRight:8 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{item.tasks?.title ?? 'Task'}</div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>
                      {item.tasks?.time_estimate} · {new Date(item.completed_at).toLocaleDateString('en', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'#FFF3EA', color:T.peach, fontWeight:700, whiteSpace:'nowrap' }}>PENDING</div>
                    <span style={{ color:T.muted, fontSize:14 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding:'0 16px 16px' }}>
                  {item.proof_text && (
                    <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:12, marginBottom:12 }}>
                      <div style={{ fontSize:10, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Rishona&apos;s proof</div>
                      <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{item.proof_text}</div>
                    </div>
                  )}
                  {item.github_hash && (
                    <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:12, marginBottom:12 }}>
                      <div style={{ fontSize:10, color:T.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>GitHub</div>
                      <div style={{ fontSize:12, color:T.purple }}>{item.github_hash}</div>
                    </div>
                  )}
                  {!item.proof_text && !item.github_hash && (
                    <div style={{ fontSize:12, color:T.muted, marginBottom:12 }}>No proof submitted — task ticked without notes.</div>
                  )}
                  <textarea
                    value={notes[item.id] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                    placeholder="Feedback for Rishona (optional)…"
                    rows={2}
                    style={{ width:'100%', padding:'10px 12px', background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:13, resize:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', marginBottom:12 }}
                  />
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => reject(item.id)} disabled={saving[item.id]}
                      style={{ flex:1, padding:12, background:'#FFF0F0', border:`1px solid ${T.red}40`, borderRadius:10, color:T.red, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      ✕ Reject
                    </button>
                    <button onClick={() => approve(item.id)} disabled={saving[item.id]}
                      style={{ flex:2, padding:12, background:'#EDFBF4', border:`1px solid ${T.mint}60`, borderRadius:10, color:T.mint, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      {saving[item.id] ? 'Saving…' : '✓ Approve'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {approved.length > 0 && (
        <div>
          <div style={{ fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
            Recently Approved ({approved.length})
          </div>
          {approved.map(item => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#EDFBF4', border:`1px solid ${T.mint}30`, borderRadius:12, marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#CCEDD9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>✓</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:T.text, fontWeight:500 }}>{item.tasks?.title ?? 'Task'}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{new Date(item.completed_at).toLocaleDateString('en', { day:'numeric', month:'short' })}</div>
              </div>
              <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'#CCEDD9', color:T.mint }}>APPROVED</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
