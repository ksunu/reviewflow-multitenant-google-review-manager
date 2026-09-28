'use client'

import { useState } from 'react'

// Mock review interface for rapid frontend layout testing
interface Review {
  id: string
  platform: 'google' | 'yelp'
  authorName: string
  rating: number
  comment: string
  sentiment: 'positive' | 'neutral' | 'negative'
  intentCategory: string
  isFlagged: boolean
  createdAt: string
  aiDraft: string
  status: 'pending' | 'approved' | 'posted'
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    platform: 'google',
    authorName: 'Minho Park',
    rating: 1,
    comment:
      'Waited 45 minutes for a table even though we booked in advance. Terrible service.',
    sentiment: 'negative',
    intentCategory: 'service_speed',
    isFlagged: true,
    createdAt: '2 hours ago',
    aiDraft:
      'Hi Minho, we sincerely apologize for the wait and the frustration caused. This is not our standard. Please reach out to us directly so we can make it right.',
    status: 'pending',
  },
  {
    id: '2',
    platform: 'yelp',
    authorName: 'Sarah Jenkins',
    rating: 5,
    comment:
      'Best workout environment in Seoul! Instructors are super professional and facilities are pristine.',
    sentiment: 'positive',
    intentCategory: 'staff_quality',
    isFlagged: false,
    createdAt: '1 day ago',
    aiDraft:
      'Thank you so much for the stellar review, Sarah! We love having you at the studio and are thrilled you enjoy the environment.',
    status: 'posted',
  },
]

export function ReviewFeed() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS)
  const [activeTab, setActiveTab] = useState<'all' | 'google' | 'yelp'>('all')

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'all') return true
    return r.platform === activeTab
  })

  const handleApprove = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'posted' } : r)),
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex gap-2">
          {(['all', 'google', 'yelp'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab} (
              {
                reviews.filter((r) => tab === 'all' || r.platform === tab)
                  .length
              }
              )
            </button>
          ))}
        </div>
      </div>

      {/* Review Cards List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`p-5 rounded-xl border bg-white shadow-xs transition-all ${
              review.sentiment === 'negative'
                ? 'border-rose-200 bg-rose-50/20'
                : 'border-gray-200'
            }`}
          >
            {/* Top row: Author, Rating, Platform, Time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {review.authorName}
                </span>
                <span className="text-amber-500 text-sm">
                  {'⭐'.repeat(review.rating)}
                </span>
                <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                  {review.platform}
                </span>
              </div>
              <span className="text-xs text-gray-500">{review.createdAt}</span>
            </div>

            {/* Review Comment */}
            <p className="text-gray-700 text-sm mb-4">{review.comment}</p>

            {/* Badges / Tags */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Intent: {review.intentCategory}
              </span>
              {review.isFlagged && (
                <span className="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-medium">
                  ⚠️ Policy Violation Flagged
                </span>
              )}
            </div>

            {/* AI Response Box */}
            <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                  🤖 AI Response Draft
                </span>
                <span className="text-xs text-gray-500">
                  Auto-tuned to Brand Voice
                </span>
              </div>
              <p className="text-sm text-gray-800 italic mb-3">
                &ldquo;{review.aiDraft}&rdquo;
              </p>

              <div className="flex items-center justify-end gap-2">
                {review.status === 'posted' ? (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">
                    ✅ Approved & Posted
                  </span>
                ) : (
                  <>
                    <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      Approve & Post
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
