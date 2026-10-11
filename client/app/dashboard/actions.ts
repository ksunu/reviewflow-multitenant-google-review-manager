'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/navigation'
import { getWorkspaceAuthorization } from '@/lib/supabase/authorization'

export async function updateReviewResponse(
  responseId: string,
  editedText: string,
  status: 'approved' | 'posted',
) {
  const supabase = await createClient()
  const { data: response } = await supabase
    .from('review_responses')
    .select('review_id')
    .eq('id', responseId)
    .maybeSingle()

  if (!response?.review_id) {
    return { success: false, error: 'Response not found' }
  }

  const { data: review } = await supabase
    .from('reviews')
    .select('workspace_id')
    .eq('id', response.review_id)
    .maybeSingle()

  if (!review?.workspace_id) {
    return { success: false, error: 'Review not found' }
  }

  const access = await getWorkspaceAuthorization(review.workspace_id, supabase)
  if (!access.authorized) {
    return { success: false, error: 'Unauthorized or forbidden' }
  }

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
