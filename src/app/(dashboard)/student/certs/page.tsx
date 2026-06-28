import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const T = { navy2:'#0F1629', border:'#1E2A47', slate:'#94A3B8', white:'#F8FAFC', amber:'#E8A838' }

const CERTS = [
  { name:'Claude 101',             provider:'Anthropic',       year:1, earned:true  },
  { name:'AI Fluency',             provider:'Anthropic',       year:1, earned:false },
  { name:'Claude Code 101',        provider:'Anthropic',       year:1, earned:false },
  { name:'Intro to Agent Skills',  provider:'Anthropic',       year:1, earned:false },
  { name:'Intro to MCP',           provider:'Anthropic',       year:1, earned:false },
  { name:'CS50x',                  provider:'Harvard / edX',   year:1, earned:false },
  { name:'Google AI Essentials',   provider:'Google',          year:1, earned:false },
  { name:'CS50 AI',                provider:'Harvard / edX',   year:1, earned:false },
  { name:'ML Specialization',      provider:'DeepLearning.AI', year:2, earned:false },
  { name:'Deep Learning Spec.',    provider:'DeepLearning.AI', year:2, earned:false },
  { name:'HF NLP Course',          provider:'Hugging Face',    year:2, earned:false },
  { name:'Practical Deep Learning',provider:'fast.ai',         year:2, earned:false },
  { name:'CrewAI Agents',          provider:'DeepLearning.AI', year:3, earned:false },
]

export default async function CertsPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const earned = CERTS.filter(c => c.earned).length

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, fontFamily:'"Space Grotesk",sans-serif' }}>Certificates</div>
        <div style={{ fontSize:13, color:T.slate, marginTop:4 }}>{earned} earned · {CERTS.length - earned} remaining across 4 years</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {CERTS.map((c, i) => (
          <div key={i} style={{ background: c.earned ? `${T.amber}10` : T.navy2, border:`1px solid ${c.earned ? T.amber+'40' : T.border}`, borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, opacity: c.earned ? 1 : 0.65 }}>
            <div style={{ width:36, height:36, borderRadius:8, background: c.earned ? `${T.amber}25` : '#141B33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
              {c.earned ? '🏅' : '🔒'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color: c.earned ? T.white : T.slate }}>{c.name}</div>
              <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{c.provider} · Year {c.year}</div>
            </div>
            {c.earned && (
              <div style={{ padding:'2px 8px', borderRadius:20, background:`${T.amber}25`, color:T.amber, fontSize:10, fontWeight:700 }}>
                EARNED
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
