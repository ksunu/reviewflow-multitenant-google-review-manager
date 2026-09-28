'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Location {
  id: string
  name: string
  place_address: string | null
  google_place_id: string | null
}

export function LocationsList({ locations }: { locations: Location[] }) {
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this location from your workspace?',
      )
    )
      return

    const { error } = await supabase.from('locations').delete().eq('id', id)

    if (error) {
      alert(`Error deleting location: ${error.message}`)
    } else {
      router.refresh()
    }
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="p-8 bg-white border rounded-xl text-center text-gray-500 space-y-2">
        <p className="font-medium text-gray-700">No locations linked yet.</p>
        <p className="text-xs text-gray-400">
          Search and link a Google Maps location below to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Active Workspace Locations
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="p-4 bg-white border rounded-lg shadow-sm flex items-center justify-between"
          >
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {loc.name}
              </h3>
              <p className="text-xs text-gray-500">
                {loc.place_address || 'No address specified'}
              </p>
              {loc.google_place_id && (
                <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-mono rounded">
                  Place ID: {loc.google_place_id}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                Connected
              </span>
              <button
                onClick={() => handleDelete(loc.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 transition"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
