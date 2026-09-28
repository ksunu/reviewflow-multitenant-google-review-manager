import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { reviewAnalysisSchema } from '@/lib/ai/prompts'

// Ollama provides an OpenAI-compatible API endpoint locally
const ollamaLocal = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // Ollama doesn't need a real key, but the SDK expects a string
})

export async function POST(request: Request) {
  try {
    const { reviewComment, rating, brandVoice } = await request.json()

    const { object } = await generateObject({
      model: ollamaLocal('llama3'), // Pass your local model name here
      schema: reviewAnalysisSchema,
      system: `You are an expert customer experience agent. Brand voice: "${brandVoice || 'Professional'}"`,
      prompt: `Analyze this review: - Rating: ${rating}/5 - Comment: "${reviewComment}"`,
    })

    return NextResponse.json({ success: true, data: object })
  } catch (error: any) {
    console.error('Local Ollama Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
