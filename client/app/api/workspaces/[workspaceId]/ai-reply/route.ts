// src/app/api/workspaces/[workspaceId]/reviews/generate-reply/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    // 0. Authenticate user session
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        locations ( name, address, business_type )
      `,
      )
      .eq('id', reviewId)
      .single()

    if (revError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
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

    // Craft tone instructions
    let toneInstruction = 'Professional and polite'
    if (tone === 'firm')
      toneInstruction = 'Firm on company policy, objective, and professional'
    if (tone === 'dispute')
      toneInstruction =
        'Professional clarification addressing inaccurate claims without being aggressive'
    if (tone === 'empathetic')
      toneInstruction = 'Deeply empathetic, apologetic, and service-oriented'

    const prompt = `
You are an expert customer success manager representing "${companyName}", which is a ${businessType} (Location: ${locationName}${locationAddress ? `, Address: ${locationAddress}` : ''}). 
Write a public response to a customer review left by "${customerName}". 
DO NOT include introductory filler like "Here is a response" or quotation marks. Output ONLY the raw response text.

Review Details:
- Rating: ${rating} / 5 stars
- Customer Name: ${customerName}
- Customer Review: "${review_text}"
- Internal Business Context / Facts: "${internalContext || 'None provided. Rely on standard customer service best practices.'}"
- Desired Tone: ${toneInstruction}

Guidelines:
- Address the customer by name ("Hello ${customerName},") when natural.
- Tailor the vocabulary to fit a ${businessType} (e.g., mentioning hospitality/dining terms for restaurants, or appointment/service terms for salons/studios).
- Keep it concise, professional, and brand-safe.
- If internal context exposes unfair claims or policy violations, politely and objectively clarify the facts without sounding defensive or hostile.
    `.trim()

    let rawReply = ''

    // 5. Call OpenAI gpt-4o-mini
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

    // 6. Fallback if OpenAI fails or is offline
    if (!rawReply) {
      if (rating === 1) {
        rawReply = internalContext
          ? `Hello ${customerName}, thank you for sharing your feedback. Regarding your visit to ${locationName}: ${internalContext}. As a quality ${businessType}, we always strive to maintain fair and transparent standards, and we regret if this experience did not meet expectations.`
          : `Hello ${customerName}, we take feedback very seriously at ${companyName} and would love to investigate this further. Please reach out to our management team directly so we can resolve this matter for you.`
      } else {
        rawReply = `Hello ${customerName}, thank you so much for the wonderful feedback! We are thrilled you had a great experience at ${locationName} and look forward to welcoming you back to our ${businessType} soon.`
      }
    }

    // 7. Clean up any accidental conversational filler from LLMs
    const cleanedReply = rawReply
      .replace(/^(here is|sure,|certainly,|response:|draft:).*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()

    // 8. Update Database: Save draft, update status to 'drafted', and increment monthly usage counter
    await supabase
      .from('reviews')
      .update({
        ai_reply_draft: cleanedReply,
        reply_status: 'drafted',
      })
      .eq('id', reviewId)

    if (!isPro) {
      await supabase
        .from('workspaces')
        .update({ ai_replies_used_this_month: used + 1 })
        .eq('id', workspaceId)
    }

    return NextResponse.json({
      reply: cleanedReply,
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
