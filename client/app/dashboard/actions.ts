'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/navigation'

export async function updateReviewResponse(
  responseId: string,
  editedText: string,
  status: 'approved' | 'posted',
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('review_responses')
    .update({
      edited_text: editedText,
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', responseId)

  if (error) {
    console.error('Failed to update response:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/reviews')
  return { success: true }
}
