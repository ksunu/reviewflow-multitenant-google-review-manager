// src/app/api/workspaces/[workspaceId]/reviews/generate-reply/route.ts
import { NextResponse } from 'next/server'
import { getWorkspaceAuthorization } from '@/lib/supabase/authorization'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params
    const { reviewId, rating, review_text, internalContext, tone } =
      await request.json()
    const access = await getWorkspaceAuthorization(workspaceId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status: access.status },
      )
    }
    const { supabase } = access

    // 1. Fetch Workspace data & quota limits
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 },
      )
    }

    // 2. Enforce Free Tier Quota Limits
    const isPro = workspace.subscription_tier === 'pro'
    const limit = isPro ? 500 : workspace.ai_reply_limit || 10
    const used = workspace.ai_replies_used_this_month || 0

    if (!isPro && used >= limit) {
      return NextResponse.json(
        {
          error: `Monthly free AI reply limit reached (${used}/${limit}). Upgrade to Pro for unlimited AI responses.`,
          requiresUpgrade: true,
        },
        { status: 403 },
      )
    }

    // 3. Fetch Review and its specific Location details
    const { data: review, error: revError } = await supabase
      .from('reviews')
      .select(
        `
        *,
        locations ( name, address, business_type, workspace_id )
      `,
      )
      .eq('id', reviewId)
      .eq('workspace_id', workspaceId)
      .single()

    if (revError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    if (review.locations?.workspace_id !== workspaceId) {
      return NextResponse.json(
        { error: 'Review location mismatch' },
        { status: 409 },
      )
    }

    // 4. Idempotency Guard: Block generation if already published to Google
    if (review.reply_status === 'posted') {
      return NextResponse.json(
        {
          error:
            'A reply has already been published to Google for this review.',
        },
        { status: 400 },
      )
    }

    const companyName = workspace?.name || 'our business'
    const locationName = review?.locations?.name || 'this location'
    const locationAddress = review?.locations?.address || ''
    const businessType =
      review?.locations?.business_type ||
      workspace?.business_type ||
      'local business'
    const customerName = review?.author_name || 'Valued Customer'

    // Determine review sentiment based on star rating
    let sentiment = 'neutral'
    if (rating >= 4) sentiment = 'positive'
    else if (rating <= 2) sentiment = 'negative'

    // Check if the review has text or is rating-only
    const hasText = Boolean(review_text && review_text.trim().length > 0)

    // Craft tone instructions
    let toneInstruction = 'Professional and polite'
    if (tone === 'firm')
      toneInstruction = 'Firm on company policy, objective, and professional'
    if (tone === 'dispute')
      toneInstruction =
        'Professional clarification addressing inaccurate claims without being aggressive'
    if (tone === 'empathetic')
      toneInstruction = 'Deeply empathetic, apologetic, and service-oriented'

    // Dynamically adjust system prompt based on whether review text exists
    // Inside src/app/api/workspaces/[workspaceId]/reviews/generate-reply/route.ts

    const prompt = hasText
      ? `
You are an expert customer success manager representing "${companyName}", which is a ${businessType} (Location: ${locationName}). 
Write a public response to a customer review left by "${customerName}". 

CRITICAL LANGUAGE INSTRUCTION:
- Automatically detect the language of the Customer Review below.
- Write the entire response in the EXACT SAME LANGUAGE as the customer's review (e.g., if review is in Spanish, reply in Spanish; if in Korean, reply in Korean; if in French, reply in French).
- DO NOT include introductory filler or quotation marks. Output ONLY the raw response text.

Review Details:
- Rating: ${rating} / 5 stars
- Customer Name: ${customerName}
- Customer Review: "${review_text}"
- Internal Business Context / Facts: "${internalContext || 'None provided.'}"
- Desired Tone: ${toneInstruction}
  `.trim()
      : `
You are an expert customer success manager representing "${companyName}", which is a ${businessType} (Location: ${locationName}). 
The customer "${customerName}" left a rating-only review without written text (${rating} out of 5 stars).

CRITICAL LANGUAGE INSTRUCTION:
- Write the entire response in the primary language specified for this workspace/location (Default: English unless context suggests otherwise).
- DO NOT include introductory filler or quotation marks. Output ONLY raw text.

Guidelines:
- Address the customer by name ("Hello ${customerName},").
- Thank them warmly for taking the time to leave a rating.
- Keep it under 2-3 sentences.
  `.trim()

    let rawReply = ''

    // 5. Try calling local Ollama instance first
    try {
      const ollamaRes = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: prompt,
          stream: false,
        }),
      })

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json()
        if (ollamaData.response) {
          rawReply = ollamaData.response.trim()
        }
      }
    } catch (ollamaErr) {
      console.log(
        'Local Ollama unavailable, falling back to OpenAI gpt-4o-mini.',
      )
    }

    // 6. Fallback to OpenAI gpt-4o-mini if Ollama is offline
    if (!rawReply && process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        })

        rawReply = completion.choices[0]?.message?.content?.trim() || ''
      } catch (openaiErr) {
        console.error(
          'OpenAI API error, falling back to smart template:',
          openaiErr,
        )
      }
    }

    // 7. Smart Template Fallbacks (differentiating between text vs rating-only)
    if (!rawReply) {
      if (hasText) {
        if (rating <= 2) {
          rawReply = internalContext
            ? `Hello ${customerName}, thank you for sharing your feedback. Regarding your visit to ${locationName}: ${internalContext}. As a quality ${businessType}, we always strive to maintain fair and transparent standards, and we regret if this experience did not meet expectations.`
            : `Hello ${customerName}, we take feedback very seriously at ${companyName} and would love to investigate this further. Please reach out to our management team directly so we can resolve this matter for you.`
        } else {
          rawReply = `Hello ${customerName}, thank you so much for the wonderful feedback! We are thrilled you had a great experience at ${locationName} and look forward to welcoming you back to our ${businessType} soon.`
        }
      } else {
        // Rating-only templates
        if (rating <= 2) {
          rawReply = `Hello ${customerName}, thank you for leaving us a rating. We're sorry to see we didn't meet your expectations at ${locationName}. If you'd be willing to share any additional details about your visit, we would love the opportunity to learn and make things right.`
        } else {
          rawReply = `Hello ${customerName}, thank you for taking the time to leave us a ${rating}-star rating! We always love hearing from our guests at ${locationName}—feel free to let us know what you enjoyed most during your visit.`
        }
      }
    }

    // 8. Clean up conversational filler
    const cleanedReply = rawReply
      .replace(/^(here is|sure,|certainly,|response:|draft:).*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()

    // 9. Update Database: Save draft, update sentiment, set status to 'drafted', increment usage
    await supabase
      .from('reviews')
      .update({
        ai_reply_draft: cleanedReply,
        reply_status: 'drafted',
        sentiment: sentiment,
      })
      .eq('id', reviewId)
      .eq('workspace_id', workspaceId)

    if (!isPro) {
      await supabase
        .from('workspaces')
        .update({ ai_replies_used_this_month: used + 1 })
        .eq('id', workspaceId)
    }

    return NextResponse.json({
      reply: cleanedReply,
      sentiment,
      usage: { used: used + 1, limit },
    })
  } catch (err: any) {
    console.error('AI reply error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate AI response' },
      { status: 500 },
    )
  }
}
