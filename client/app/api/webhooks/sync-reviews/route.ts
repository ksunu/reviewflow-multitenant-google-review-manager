import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { reviewAnalysisSchema } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

// Initialize local Ollama client via OpenAI-compatible endpoint
const ollamaLocal = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      locationId,
      externalReviewId,
      platform,
      authorName,
      rating,
      review_text,
      reviewDate,
    } = body

    // Validation check
    if (!locationId || !externalReviewId || !review_text) {
      return NextResponse.json(
        { error: 'Missing required review fields' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // 1. Check if review already exists to prevent duplicate processing
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('external_review_id', externalReviewId)
      .single()

    if (existingReview) {
      return NextResponse.json({
        success: true,
        message: 'Review already indexed',
      })
    }

    // 2. Fetch location brand voice profile if configured, or fallback
    const { data: locationData } = await supabase
      .from('locations')
      .select('brand_voice_profile')
      .eq('id', locationId)
      .single()

    const brandVoice =
      locationData?.brand_voice_profile ||
      'Professional, polite, and empathetic'

    // 3. Run Local AI Pipeline (Ollama) ONCE upon ingestion
    const { object: analysis } = await generateObject({
      model: ollamaLocal('llama3'),
      schema: reviewAnalysisSchema,
      system: `You are an expert customer experience agent. Brand voice: "${brandVoice}"`,
      prompt: `Analyze this review: - Rating: ${rating}/5 - Comment: "${review_text}"`,
    })

    // 4. Insert the review into Supabase
    const { data: insertedReview, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        location_id: locationId,
        platform: platform || 'google',
        external_review_id: externalReviewId,
        author_name: authorName,
        rating: rating,
        review_text: review_text,
        sentiment: analysis.sentiment,
        intent_category: analysis.intentCategory,
        is_flagged_policy_violation: analysis.isFlaggedPolicyViolation,
        review_date: reviewDate || new Date().toISOString(),
      })
      .select()
      .single()

    if (reviewError) throw reviewError

    // 5. Insert the corresponding AI draft response into review_responses
    const { error: responseError } = await supabase
      .from('review_responses')
      .insert({
        review_id: insertedReview.id,
        ai_draft_text: analysis.aiDraftText,
        status: 'pending',
      })

    if (responseError) throw responseError

    return NextResponse.json({
      success: true,
      message: 'Review ingested, analyzed locally, and persisted successfully',
      data: { reviewId: insertedReview.id, analysis },
    })
  } catch (error: any) {
    console.error('Ingestion Pipeline Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
