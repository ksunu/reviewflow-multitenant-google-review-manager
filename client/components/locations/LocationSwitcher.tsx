'use client' // Must be at the very top!

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Location {
  id: string
  name: string
  business_type?: string
}

export default function LocationSwitcher({
  locations,
}: {
  locations: Location[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentLocationId =
    searchParams.get('locationId') || locations[0]?.id || ''

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    const params = new URLSearchParams(searchParams.toString())

    if (selectedId) {
      params.set('locationId', selectedId)
    } else {
      params.delete('locationId')
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
        No locations added yet
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:inline">
        Store:
      </span>
      <select
        value={currentLocationId}
        onChange={handleSelectChange}
        className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-1.5 shadow-xs font-medium cursor-pointer"
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name} {loc.business_type ? `(${loc.business_type})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
