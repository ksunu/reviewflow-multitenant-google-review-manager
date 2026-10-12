// src/types/stats.ts
export interface WorkspaceReviewStats {
  workspace_id: string
  total_reviews: number
  average_rating: number
  positive_count: number
  neutral_count: number
  negative_count: number
  posted_replies_count: number
}

export interface RatingDistributionItem {
  rating: number
  count: number
}
