import { createClient } from '@/lib/supabase/server'
import { ReviewCard } from './ReviewCard'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ReviewsPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/')
  }

  // 2. Get the user's tenant_id
  const { data: membership, error: membershipError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    redirect('/onboarding')
  }

  // 3. Get locations belonging to this tenant
  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('tenant_id', membership.tenant_id)

  const locationIds = locations?.map((l) => l.id) || []

  // 4. Fetch reviews only for this tenant's locations
  let reviews: any[] = []
  if (locationIds.length > 0) {
    const { data: fetchedReviews } = await supabase
      .from('reviews')
      .select(
        `
        *,
        review_responses (
          id,
          ai_draft_text,
          edited_text,
          status
        )
      `,
      )
      .in('location_id', locationIds)
      .order('review_date', { ascending: false })

    reviews = fetchedReviews || []
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Review Response Feed
          </h1>
          <p className="text-sm text-gray-500">
            Review incoming feedback and approve AI-generated response drafts.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-purple-600 hover:underline font-medium"
        >
          ← Back to Overview
        </Link>
      </div>

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="p-8 text-center border rounded-lg bg-white text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">
              No reviews found for your locations yet.
            </p>
            <p className="text-xs text-gray-400">
              Make sure your incoming webhook points to a valid `location_id`
              belonging to your tenant workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
