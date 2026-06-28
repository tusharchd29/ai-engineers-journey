import { createClient } from '@/lib/supabase/client'

export async function getPhases() {
  const sb = createClient()
  const { data, error } = await sb.from('phases').select('*').order('year').order('month')
  if (error) throw error
  return data ?? []
}
