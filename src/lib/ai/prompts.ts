import { z } from 'zod'

// Define the exact schema we want the AI to return
export const reviewAnalysisSchema = z.object({
  sentiment: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('Overall sentiment of the review'),
  intentCategory: z
    .string()
    .describe(
      'Short tag representing the core topic, e.g. service_speed, food_quality, pricing, cleanliness',
    ),
  isFlaggedPolicyViolation: z
    .boolean()
    .describe(
      'True if the review appears to violate platform terms, contains spam, hate speech, or competitor harassment',
    ),
  aiDraftText: z
    .string()
    .describe(
      'A polite, empathetic, and professional response draft tailored to the business brand voice',
    ),
})

export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>
