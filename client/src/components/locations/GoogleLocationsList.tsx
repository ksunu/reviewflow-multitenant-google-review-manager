'use client'

import { useState, useEffect } from 'react'
import { fetchGoogleLocations } from '@/app/dashboard/[workspaceId]/locations/actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function GoogleLocationsList({ tenantId }: { tenantId: string }) {
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadLocations() {
      const res = await fetchGoogleLocations()
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setLocations(res.locations)
      }
      setLoading(false)
    }
    loadLocations()
  }, [])

  const handleImportLocation = async (loc: any) => {
    setSyncingId(loc.name)

    // Extract useful fields from Google's response payload
    const locationName = loc.title || 'Untitled Location'
    const placeId = loc.metadata?.placeId || null
    const address = loc.storefrontAddress
      ? Object.values(loc.storefrontAddress).join(', ')
      : ''

    const { error } = await supabase.from('locations').insert({
      tenant_id: tenantId,
      name: locationName,
      google_place_id: placeId,
      place_address: address,
      brand_voice_profile: 'Professional, polite, and empathetic',
    })

    if (error) {
      alert(`Error importing location: ${error.message}`)
    } else {
      alert(`Successfully imported "${locationName}"!`)
      router.refresh()
    }
    setSyncingId(null)
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 animate-pulse">
        Loading locations from Google Business Profile...
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm space-y-2">
        <p className="font-semibold">Unable to load Google locations</p>
        <p className="text-xs">{errorMsg}</p>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="p-6 bg-white border rounded-xl text-center space-y-2">
        <p className="text-sm font-medium text-gray-700">
          No locations found in your connected Google account.
        </p>
        <p className="text-xs text-gray-400">
          Ensure your Google account has active Business Profile listings.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        Your Google Business Locations
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {locations.map((loc) => (
          <div
            key={loc.name}
            className="p-4 bg-white border rounded-lg shadow-sm flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">{loc.title}</h3>
              <p className="text-xs text-gray-500">
                {loc.storefrontAddress
                  ? Object.values(loc.storefrontAddress).join(', ')
                  : 'No address provided'}
              </p>
            </div>
            <button
              onClick={() => handleImportLocation(loc)}
              disabled={syncingId === loc.name}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition disabled:opacity-50"
            >
              {syncingId === loc.name ? 'Importing...' : 'Import to Dashboard'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
