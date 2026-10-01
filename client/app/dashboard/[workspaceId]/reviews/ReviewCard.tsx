'use client'

import { useState } from 'react'
import { updateReviewResponse } from '../../actions'

interface ReviewItemProps {
  review: {
    id: string
    author_name: string
    rating: number
    comment: string
    review_date: string
    review_responses?: Array<{
      id: string
      ai_draft_text: string
      edited_text: string | null
      status: string
    }>
  }
}

export function ReviewCard({ review }: ReviewItemProps) {
  const response = review.review_responses?.[0]
  const [text, setText] = useState(
    response?.edited_text || response?.ai_draft_text || '',
  )
  const [status, setStatus] = useState(response?.status || 'pending')
  const [loading, setLoading] = useState(false)

  if (!response) return null

  const handleSave = async (newStatus: 'approved' | 'posted') => {
    setLoading(true)
    const res = await updateReviewResponse(response.id, text, newStatus)
    if (res.success) {
      setStatus(newStatus)
    }
    setLoading(false)
  }

  return (
    <div className="p-5 border rounded-lg bg-white shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{review.author_name}</h3>
          <p className="text-xs text-gray-400">
            {new Date(review.review_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
            {review.rating} ★
          </span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded uppercase ${
              status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">
        {review.comment}
      </p>

      {/* AI Draft & Edit Section */}
      <div className="space-y-2 pt-2 border-t">
        <label className="text-xs font-semibold text-purple-600 block">
          AI Suggested Response (Editable):
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full p-3 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-800"
          disabled={loading || status === 'posted'}
        />

        {status !== 'posted' && (
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => handleSave('approved')}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition"
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('posted')}
              disabled={loading}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition shadow-sm"
            >
              {loading ? 'Posting...' : 'Approve & Post'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
