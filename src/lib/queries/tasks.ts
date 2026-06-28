import { createClient } from '@/lib/supabase/client'

export async function getTasksForPhase(phaseId: string) {
  const sb = createClient()
  const { data, error } = await sb.from('tasks').select('*').eq('phase_id', phaseId).order('task_order')
  if (error) throw error
  return data ?? []
}

export async function getCompletions(studentId: string) {
  const sb = createClient()
  const { data, error } = await sb.from('task_completions').select('*').eq('student_id', studentId)
  if (error) throw error
  return data ?? []
}

export async function markTaskDone(taskId: string, studentId: string, proofText?: string) {
  const sb = createClient()
  const { data, error } = await sb.from('task_completions')
    .upsert({ task_id: taskId, student_id: studentId, proof_text: proofText, parent_approved: false },
             { onConflict: 'task_id,student_id' })
    .select().single()
  if (error) throw error
  return data
}

export async function approveCompletion(completionId: string, notes?: string) {
  const sb = createClient()
  const { error } = await sb.from('task_completions')
    .update({ parent_approved: true, parent_approved_at: new Date().toISOString(), parent_notes: notes })
    .eq('id', completionId)
  if (error) throw error
}

export async function getPendingApprovals(studentId: string) {
  const sb = createClient()
  const { data, error } = await sb.from('task_completions')
    .select('*, tasks(*)')
    .eq('student_id', studentId)
    .eq('parent_approved', false)
    .order('completed_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
