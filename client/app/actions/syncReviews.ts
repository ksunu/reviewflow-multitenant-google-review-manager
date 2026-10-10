// src/app/actions/syncReviews.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function syncLocationReviews(
  locationId: string,
  workspaceId: string,
) {
  const supabase = await createClient()

  try {
    // 1. Authenticate user and verify workspace permissions
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // 2. Fetch the location and workspace subscription tier
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, google_place_id, workspace_id, last_synced_at')
      .eq('id', locationId)
      .single()

    if (locError || !location?.google_place_id) {
      throw new Error('Location not found or missing Google Place ID.')
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('subscription_tier')
      .eq('id', workspaceId)
      .single()

    // 3. Cooldown Rule for Free Tier (e.g., 24-hour restriction to save API costs)
    if (workspace?.subscription_tier !== 'pro' && location?.last_synced_at) {
      const lastSync = new Date(location.last_synced_at).getTime()
      const hoursSinceLastSync = (Date.now() - lastSync) / (1000 * 60 * 60)

      if (hoursSinceLastSync < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastSync)
        return {
          success: false,
          error: `Free tier allows syncing once every 24 hours. Try again in ${hoursRemaining} hours, or upgrade to Pro for unlimited syncs.`,
          requiresUpgrade: true,
        }
      }
    }

    // 4. Find the most recent review date already stored to optimize incremental filtering
    const { data: latestReview } = await supabase
      .from('reviews')
      .select('review_date')
      .eq('location_id', locationId)
      .order('review_date', { ascending: false })
      .limit(1)
      .single()

    const lastSyncTimestamp = latestReview?.review_date
      ? new Date(latestReview.review_date).getTime()
      : 0

    // 5. Call Google Places API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY // Or your server-side secret key
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${location.google_place_id}&fields=reviews,rating,user_ratings_total&key=${apiKey}`

    const response = await fetch(url)
    const result = await response.json()

    if (result.status !== 'OK' || !result.result?.reviews) {
      // Still update the last_synced_at timestamp even if no new reviews came back
      await supabase
        .from('locations')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', locationId)

      return {
        success: true,
        count: 0,
        message: 'Sync completed. No reviews returned from Google.',
      }
    }

    const googleReviews = result.result.reviews

    // 6. Transform and optionally filter for incremental sync
    const reviewsToUpsert = googleReviews
      .map((rev: any) => ({
        workspace_id: workspaceId,
        location_id: locationId,
        author_name: rev.author_name,
        author_url: rev.author_url,
        profile_photo_url: rev.profile_photo_url,
        rating: rev.rating,
        review_text: rev.text,
        review_date: new Date(rev.time * 1000).toISOString(),
        relative_time_description: rev.relative_time_description,
        original_language: rev.original_language,
        source: 'google',
        status: 'pending',
      }))
      .filter((rev: any) => {
        // Optional: Skip reviews older than what we already have to save write operations
        const reviewTime = new Date(rev.review_date).getTime()
        // If it's brand new or newer than our last recorded sync point, keep it
        return lastSyncTimestamp === 0 || reviewTime >= lastSyncTimestamp
      })

    if (reviewsToUpsert.length > 0) {
      // 7. Upsert reviews safely using the unique constraint
      const { error: upsertError } = await supabase
        .from('reviews')
        .upsert(reviewsToUpsert, {
          onConflict: 'workspace_id,location_id,review_date,author_name',
        })

      if (upsertError) throw upsertError
    }

    // 8. Update location's last_synced_at timestamp
    await supabase
      .from('locations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', locationId)

    return { success: true, count: reviewsToUpsert.length }
  } catch (err: any) {
    console.error('Sync error:', err)
    return { success: false, error: err.message }
  }
}
