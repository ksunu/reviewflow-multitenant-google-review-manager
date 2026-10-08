// src/app/actions/syncReviews.ts
'use server'

import { createClient } from '@/lib/supabase/server' // or your server client

export async function syncLocationReviews(
  locationId: string,
  workspaceId: string,
) {
  const supabase = await createClient()

  try {
    // 1. Fetch the location's Google Place ID from your database

    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, google_place_id, workspace_id')
      .eq('id', locationId)
      .single()

    if (locError || !location?.google_place_id) {
      throw new Error('Location not found or missing Google Place ID.')
    }

    // 2. Call Google Places API (or your backend service) to fetch reviews
    // Note: Google Places API (New/Legacy) returns reviews for the place_id.
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY // Or server-side secret key
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${location.google_place_id}&fields=reviews,rating,user_ratings_total&key=${apiKey}`

    const response = await fetch(url)
    const result = await response.json()

    if (result.status !== 'OK' || !result.result?.reviews) {
      return {
        success: true,
        count: 0,
        message: 'No new reviews found from Google.',
      }
    }

    const googleReviews = result.result.reviews

    // 3. Transform and upsert reviews into Supabase scoped to this location & workspace
    const reviewsToUpsert = googleReviews.map((rev: any) => ({
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

    // Assuming you have a unique constraint or primary key on review id/author/date to avoid duplicates
    const { error: upsertError } = await supabase
      .from('reviews')
      .upsert(reviewsToUpsert, {
        onConflict: 'workspace_id,location_id,review_date,author_name',
      })

    if (upsertError) throw upsertError

    return { success: true, count: reviewsToUpsert.length }
  } catch (err: any) {
    console.error('Sync error:', err)
    return { success: false, error: err.message }
  }
}
