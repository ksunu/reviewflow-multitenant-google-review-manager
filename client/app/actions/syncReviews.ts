// src/app/actions/syncReviews.ts
'use server'

import { getWorkspaceAuthorization } from '@/lib/supabase/authorization'

// Apify Client commented out
// import { ApifyClient } from 'apify-client'
// const apify = new ApifyClient({
//   token: process.env.APIFY_API_TOKEN,
// })

export async function syncLocationReviews(
  locationId: string,
  workspaceId: string,
) {
  const access = await getWorkspaceAuthorization(workspaceId)
  if (!access.authorized) {
    return {
      success: false,
      error: access.status === 401 ? 'Unauthorized' : 'Forbidden',
    }
  }
  const { supabase } = access

  try {
    // 2. Fetch Location details & Place ID
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, google_place_id, workspace_id, last_synced_at')
      .eq('id', locationId)
      .eq('workspace_id', workspaceId)
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
      .eq('workspace_id', workspaceId)
      .order('review_date', { ascending: false })
      .limit(1)
      .single()

    const lastSyncTimestamp = latestReview?.review_date
      ? new Date(latestReview.review_date).getTime()
      : 0

    // 6. Fetch reviews directly via Google Places API (Details endpoint)
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Google Maps API Key is not configured on the server.')
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${location.google_place_id}&fields=reviews,name&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(
        `Google Places API error: ${data.status} - ${data.error_message || ''}`,
      )
    }

    const googleReviews = data.result?.reviews || []

    if (!googleReviews.length) {
      await supabase
        .from('locations')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', locationId)
        .eq('workspace_id', workspaceId)

      return {
        success: true,
        count: 0,
        message: 'Sync completed. No new reviews found.',
      }
    }

    // 7. Format and filter incoming Google Places reviews
    const reviewsToUpsert = googleReviews
      .map((rev: any) => ({
        workspace_id: workspaceId,
        location_id: locationId,
        author_name: rev.author_name || 'Anonymous',
        author_url: rev.author_url || null,
        profile_photo_url: rev.profile_photo_url || null,
        rating: rev.rating,
        review_text: rev.text || '',
        review_date: rev.time
          ? new Date(rev.time * 1000).toISOString()
          : new Date().toISOString(),
        relative_time_description: rev.relative_time_description || '',
        source: 'google_places_api',
        status: 'pending',
        reply_status: 'unreplied',
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
      .eq('workspace_id', workspaceId)

    return { success: true, count: reviewsToUpsert.length }
  } catch (err: any) {
    console.error('Google Places review sync error:', err)
    return { success: false, error: err.message || 'Failed to sync reviews.' }
  }
}
