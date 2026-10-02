import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params
    const { reviewId, rating, comment, internalContext, tone } =
      await request.json()
    const supabase = await createClient()

    // 1. Fetch Workspace name & business type (if column exists, else default)
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    // 2. Fetch Review and its specific Location details
    const { data: review } = await supabase
      .from('reviews')
      .select(
        `
        *,
        locations ( name, address, business_type )
      `,
      )
      .eq('id', reviewId)
      .single()

    const companyName = workspace?.name || 'our business'
    const locationName = review?.locations?.name || 'this location'
    const locationAddress = review?.locations?.address || ''
    // Fallback to workspace type or generic local business if location-specific type is blank
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
- Customer Review: "${comment}"
- Internal Business Context / Facts: "${internalContext || 'None provided. Rely on standard customer service best practices.'}"
- Desired Tone: ${toneInstruction}

Guidelines:
- Address the customer by name ("Hello ${customerName},") when natural.
- Tailor the vocabulary to fit a ${businessType} (e.g., mentioning hospitality/dining terms for restaurants, or appointment/service terms for salons/studios).
- Keep it concise, professional, and brand-safe.
- If internal context exposes unfair claims or policy violations, politely and objectively clarify the facts without sounding defensive or hostile.
    `.trim()

    let rawReply = ''

    // 1. Try calling local Ollama instance
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
        'Local Ollama unavailable, falling back to smart template simulation.',
      )
    }

    // 2. Fallback if Ollama is offline
    if (!rawReply) {
      if (rating === 1) {
        rawReply = internalContext
          ? `Hello ${customerName}, thank you for sharing your feedback. Regarding your visit to ${locationName}: ${internalContext}. As a quality ${businessType}, we always strive to maintain fair and transparent standards, and we regret if this experience did not meet expectations.`
          : `Hello ${customerName}, we take feedback very seriously at ${companyName} and would love to investigate this further. Please reach out to our management team directly so we can resolve this matter for you.`
      } else {
        rawReply = `Hello ${customerName}, thank you so much for the wonderful feedback! We are thrilled you had a great experience at ${locationName} and look forward to welcoming you back to our ${businessType} soon.`
      }
    }

    // 3. Clean up any accidental conversational filler from LLMs
    const cleanedReply = rawReply
      .replace(/^(here is|sure,|certainly,|response:|draft:).*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()

    return NextResponse.json({ reply: cleanedReply })
  } catch (err: any) {
    console.error('AI reply error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate AI response' },
      { status: 500 },
    )
  }
}
