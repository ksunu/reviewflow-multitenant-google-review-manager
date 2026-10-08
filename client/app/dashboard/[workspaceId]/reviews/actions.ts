'use server'

import { createClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/ai/response-generator'
import { revalidatePath } from 'next/cache'

export async function generateAndSaveAIResponse(
  reviewId: string,
  workspaceId: string,
) {
  const supabase = await createClient()

  // 1. Fetch review and associated location name
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select(
      `
      *,
      locations ( name )
    `,
    )
    .eq('id', reviewId)
    .single()

  if (fetchError || !review) {
    return { success: false, error: 'Review not found.' }
  }

  const businessName = review.locations?.name || 'our business'

  // 2. Generate response via Ollama/AI
  const aiResult = await generateReviewResponse(
    review.review_text || 'Great experience!',
    review.rating,
    businessName,
  )

  if (!aiResult.success) {
    return { success: false, error: aiResult.error }
  }

  // 3. Save AI response and update status to 'replied' in Supabase
  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      ai_response: aiResult.response,
      status: 'replied',
    })
    .eq('id', reviewId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath(`/dashboard/${workspaceId}/reviews`)
  return { success: true, response: aiResult.response }
}
