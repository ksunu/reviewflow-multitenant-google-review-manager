'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/user'

export async function fetchGoogleLocations() {
  const supabase = await createClient()

  // 1. Get current authenticated user
  const user = await getCurrentUser()

  // 2. Retrieve the user's stored Google access token from user_integrations
  const { data: integration, error: intError } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user!.id)
    .eq('provider', 'google')
    .single()

  if (intError || !integration?.access_token) {
    return {
      error: 'Google account not connected or token missing.',
      locations: [],
    }
  }

  try {
    // 3. First, get the Google Business Account ID(s)
    const accountsRes = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: { Authorization: `Bearer ${integration.access_token}` },
      },
    )
    const accountsData = await accountsRes.json()

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      return { error: 'No Google Business accounts found.', locations: [] }
    }

    const accountName = accountsData.accounts[0].name // e.g., "accounts/123456789"

    // 4. Fetch locations for that account
    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
      {
        headers: { Authorization: `Bearer ${integration.access_token}` },
      },
    )
    const locationsData = await locationsRes.json()

    return {
      error: null,
      locations: locationsData.locations || [],
    }
  } catch (err: any) {
    console.error('Failed to fetch Google locations:', err)
    return {
      error: err.message || 'Failed to communicate with Google API',
      locations: [],
    }
  }
}

export async function searchPublicPlaces(query: string) {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return {
      error: 'Google Maps API key is missing from environment variables.',
      places: [],
    }
  }

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
        },
        body: JSON.stringify({ textQuery: query }),
      },
    )

    const data = await res.json()

    if (data.error) {
      console.error('Places API error:', data.error)
      return { error: data.error.message, places: [] }
    }

    return { error: null, places: data.places || [] }
  } catch (err: any) {
    console.error('Failed to query Google Places:', err)
    return { error: err.message, places: [] }
  }
}
