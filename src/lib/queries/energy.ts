import { createClient } from '@/lib/supabase/client'

export async function getEnergyLogs(studentId: string, days = 7) {
  const sb = createClient()
  const since = new Date(); since.setDate(since.getDate() - days)
  const { data, error } = await sb.from('energy_logs')
    .select('*').eq('student_id', studentId)
    .gte('log_date', since.toISOString().split('T')[0])
    .order('log_date')
  if (error) throw error
  return data ?? []
}

export async function logEnergy(studentId: string, score: number, notes?: string) {
  const sb = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await sb.from('energy_logs')
    .upsert({ student_id: studentId, log_date: today, score, notes },
             { onConflict: 'student_id,log_date' })
    .select().single()
  if (error) throw error
  // Auto burnout detection
  const recent = await getEnergyLogs(studentId, 3)
  if (recent.length >= 3 && recent.every(l => l.score <= 4)) {
    await sb.from('burnout_flags').insert({
      student_id: studentId, flag_type: 'amber',
      trigger_reason: 'Energy score ≤ 4 for 3 consecutive days'
    })
  }
  return data
}

export async function getBurnoutFlags(studentId: string) {
  const sb = createClient()
  const { data } = await sb.from('burnout_flags')
    .select('*').eq('student_id', studentId).eq('is_active', true)
  return data ?? []
}
