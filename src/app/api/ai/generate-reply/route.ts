import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { reviewAnalysisSchema } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

// Ollama provides an OpenAI-compatible API endpoint locally
const ollamaLocal = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // Ollama doesn't need a real key, but the SDK expects a string
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewComment, rating, brandVoice } = await request.json()

    const { object } = await generateObject({
      model: ollamaLocal('llama3'), // Pass your local model name here
      schema: reviewAnalysisSchema,
      system: `You are an expert customer experience agent. Brand voice: "${brandVoice || 'Professional'}"`,
      prompt: `Analyze this review: - Rating: ${rating}/5 - Comment: "${reviewComment}"`,
    })

    return NextResponse.json({ success: true, data: object })
  } catch (error) {
    console.error('Local Ollama Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    )
  }
}
