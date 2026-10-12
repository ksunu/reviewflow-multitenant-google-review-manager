// lib/utils/place-helpers.ts

export function formatGooglePlaceType(googleType: string = ''): string {
  if (!googleType) return 'local business'

  // Replace underscores with spaces and capitalize each word
  return googleType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Extracts and cleans the primary business type from Google Places API types array.
 * Google often returns arrays like: ['restaurant', 'food', 'point_of_interest']
 */
export function extractPrimaryBusinessType(googleTypes: string[] = []): string {
  if (!googleTypes || googleTypes.length === 0) return 'local business'

  // Filter out generic generic/noise tags to find a meaningful business category
  const ignoredTags = [
    'point_of_interest',
    'establishment',
    'geocode',
    'premise',
  ]
  const specificType =
    googleTypes.find((t) => !ignoredTags.includes(t)) || googleTypes[0]

  return formatGooglePlaceType(specificType)
}
