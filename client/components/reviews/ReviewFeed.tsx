'use client'

import React from 'react'

interface Review {
  id: string
  author_name: string
  rating: number
  review_text: string
  review_date: string
  status: 'pending' | 'drafted' | 'approved' | 'sent'
  ai_draft_response?: string
}

interface ReviewFeedProps {
  reviews: Review[]
  onGenerateReply: (reviewId: string) => void
  loadingReviewId?: string | null
}

export default function ReviewFeed({
  reviews,
  onGenerateReply,
  loadingReviewId,
}: ReviewFeedProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-300 rounded-xl bg-white/50">
        <p className="text-gray-500 font-medium">
          No reviews found for this location yet.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Incoming reviews will sync automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs transition-all hover:shadow-md"
        >
          {/* Header: Author & Rating */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                {review.author_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  {review.author_name}
                </h4>
                <span className="text-xs text-gray-400">
                  {new Date(review.review_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Review Comment */}
          <p className="text-gray-700 text-sm my-3 leading-relaxed">
            {review.review_text || (
              <span className="italic text-gray-400">
                No review_text provided (rating only).
              </span>
            )}
          </p>

          {/* AI Response Section */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  review.status === 'sent'
                    ? 'bg-green-50 text-green-700'
                    : review.status === 'drafted'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {review.status === 'sent'
                  ? '✓ Replied'
                  : review.status === 'drafted'
                    ? '✨ AI Draft Ready'
                    : '⏳ Pending Response'}
              </span>
            </div>

            {/* Action Trigger */}
            {review.status === 'pending' && (
              <button
                onClick={() => onGenerateReply(review.id)}
                disabled={loadingReviewId === review.id}
                className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {loadingReviewId === review.id
                  ? 'Generating...'
                  : '✨ Generate 1-Click AI Reply'}
              </button>
            )}
          </div>

          {/* Draft Preview Box (if generated) */}
          {review.ai_draft_response && (
            <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
              <strong className="block mb-1 text-indigo-700">
                AI Draft Response:
              </strong>
              {review.ai_draft_response}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
