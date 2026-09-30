'use client'

import { useState } from 'react'
import { searchPublicPlaces } from '@/app/dashboard/[workspaceId]/locations/actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function PublicPlaceSearch({ tenantId }: { tenantId: string }) {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    const res = await searchPublicPlaces(query)
    setPlaces(res.places || [])
    setLoading(false)
  }

  const handleImport = async (place: any) => {
    setImportingId(place.id)

    const placeName = place.displayName?.text || 'Unnamed Location'
    const placeAddress = place.formattedAddress || ''
    const googlePlaceId = place.id

    const payload = {
      tenant_id: tenantId, // <--- THIS WAS MISSING
      name: placeName,
      google_place_id: googlePlaceId,
      place_address: placeAddress,
      brand_voice_profile: 'Professional, polite, and empathetic',
    }

    console.log('Sending payload to locations:', payload) // Check browser console to verify

    const { error } = await supabase.from('locations').insert(payload)

    if (error) {
      alert(`Error importing place: ${error.message}`)
    } else {
      alert(`Successfully imported "${placeName}"!`)
      router.refresh()
    }
    setImportingId(null)
  }
  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white border rounded-xl shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Search & Link Google Maps Location
        </h2>
        <p className="text-xs text-gray-500">
          Search for any public business or store to connect it to your
          workspace.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Starbucks Madrid or Coffee Shop Seoul..."
          className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {places.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Search Results
          </h3>
          <div className="space-y-2">
            {places.map((place) => (
              <div
                key={place.id}
                className="p-4 border rounded-lg flex items-center justify-between bg-gray-50"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {place.displayName?.text}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {place.formattedAddress}
                  </p>
                  {place.rating && (
                    <p className="text-xs font-medium text-amber-600">
                      ★ {place.rating} ({place.userRatingCount || 0} reviews)
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleImport(place)}
                  disabled={importingId === place.id}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition disabled:opacity-50 shadow-sm"
                >
                  {importingId === place.id ? 'Importing...' : 'Link Location'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
