// src/app/actions/syncReviews.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { ApifyClient } from 'apify-client'

const apify = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

export async function syncLocationReviews(
  locationId: string,
  workspaceId: string,
) {
  const supabase = await createClient()

  try {
    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // 2. Fetch Location details & Place ID
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, google_place_id, workspace_id, last_synced_at')
      .eq('id', locationId)
      .single()

    if (locError || !location?.google_place_id) {
      throw new Error('Location not found or missing Google Place ID.')
    }

    // 3. Fetch Workspace tier details
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('subscription_tier, language')
      .eq('id', workspaceId)
      .single()

    const isPro = workspace?.subscription_tier === 'pro'

    // 4. Cooldown Guard for Free Tier (once every 24 hours)
    if (!isPro && location?.last_synced_at) {
      const lastSync = new Date(location.last_synced_at).getTime()
      const hoursSinceLastSync = (Date.now() - lastSync) / (1000 * 60 * 60)

      if (hoursSinceLastSync < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastSync)
        return {
          success: false,
          error: `Free tier syncs once every 24 hours. Try again in ${hoursRemaining} hours, or upgrade to Pro.`,
          requiresUpgrade: true,
        }
      }
    }

    // 5. Fetch latest review timestamp for incremental syncing
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

    // 6. Configure Apify Google Maps Scraper Actor Input
    // Free tier checks top 20 reviews; Pro checks up to 100 historical reviews
    const reviewsLimit = isPro ? 100 : 20

    const input = {
      startUrls: [
        `https://www.google.com/maps/place/?q=place_id:${location.google_place_id}`,
      ],
      maxReviews: reviewsLimit,
      reviewsSort: 'newest',
      // 'all' preserves original review languages without auto-translation
      language: workspace?.language || 'all',
    }

    // Run the compass/crawler-google-places Actor on Apify
    const run = await apify.actor('compass/crawler-google-places').call(input)

    // Fetch scraped dataset items
    const { items } = await apify.dataset(run.defaultDatasetId).listItems()

    const placeData: any = items?.[0]
    const googleReviews = placeData?.reviews || []

    if (!googleReviews.length) {
      await supabase
        .from('locations')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', locationId)

      return {
        success: true,
        count: 0,
        message: 'Sync completed. No new reviews found.',
      }
    }

    // 7. Format and filter incoming Apify reviews
    const reviewsToUpsert = googleReviews
      .map((rev: any) => ({
        workspace_id: workspaceId,
        location_id: locationId,
        author_name: rev.name || rev.author_name || 'Anonymous',
        author_url: rev.reviewerUrl || rev.author_url || null,
        profile_photo_url:
          rev.reviewerPhotoUrl || rev.profile_photo_url || null,
        rating: rev.stars || rev.rating,
        review_text: rev.text || rev.review_text || '',
        review_date: rev.publishedAtDate
          ? new Date(rev.publishedAtDate).toISOString()
          : new Date().toISOString(),
        relative_time_description:
          rev.publishedAgo || rev.relative_time_description || '',
        source: 'apify_google_maps',
        status: 'pending',
        reply_status: rev.responseFromOwnerText ? 'posted' : 'unreplied',
      }))
      .filter((rev: any) => {
        const reviewTime = new Date(rev.review_date).getTime()
        // Incremental check: only process new reviews
        return lastSyncTimestamp === 0 || reviewTime >= lastSyncTimestamp
      })

    // 8. Upsert safely to prevent duplicates
    if (reviewsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('reviews')
        .upsert(reviewsToUpsert, {
          onConflict: 'workspace_id,location_id,review_date,author_name',
        })

      if (upsertError) throw upsertError
    }

    // 9. Update last_synced_at timestamp on location
    await supabase
      .from('locations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', locationId)

    return { success: true, count: reviewsToUpsert.length }
  } catch (err: any) {
    console.error('Apify review sync error:', err)
    return { success: false, error: err.message || 'Failed to sync reviews.' }
  }
}
