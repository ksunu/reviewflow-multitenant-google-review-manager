// lib/ai/response-generator.ts
import OpenAI from 'openai'

const aiClient = new OpenAI({
  baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.AI_API_KEY || 'ollama', // Ollama fallback key
})

export async function generateReviewResponse(
  reviewComment: string,
  rating: number,
  businessName: string,
) {
  const modelName = process.env.AI_MODEL_NAME || 'llama3'

  try {
    const completion = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are a professional customer success manager for ${businessName}. Write a polite, concise, and brand-appropriate response to the customer review. If the rating is low (1-3 stars), apologize, acknowledge their concern, and invite them to resolve it via direct contact. If high (4-5 stars), express genuine gratitude.`,
        },
        {
          role: 'user',
          content: `Rating: ${rating}/5 stars\nReview: "${reviewComment}"`,
        },
      ],
      temperature: 0.7,
    })

    return {
      success: true,
      response:
        completion.choices[0]?.message?.content?.trim() ||
        'Thank you for your feedback!',
    }
  } catch (error: any) {
    console.error('AI Generation Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate AI response',
    }
  }
}
