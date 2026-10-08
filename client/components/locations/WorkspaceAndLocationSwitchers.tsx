'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Workspace {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  business_type?: string
}

interface Props {
  workspaces: Workspace[]
  locations: Location[]
  activeWorkspaceId: string
  activeLocationId: string
}

export default function WorkspaceAndLocationSwitchers({
  workspaces,
  locations,
  activeWorkspaceId,
  activeLocationId,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWsId = e.target.value
    const params = new URLSearchParams(searchParams.toString())

    params.set('workspaceId', newWsId)
    params.delete('locationId') // Reset location when workspace changes to avoid orphan IDs

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocId = e.target.value
    const params = new URLSearchParams(searchParams.toString())

    if (newLocId === 'all') {
      params.delete('locationId')
    } else if (newLocId) {
      params.set('locationId', newLocId)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Workspace Dropdown */}
      <div className="flex items-center space-x-1.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:inline">
          Org:
        </span>
        <select
          value={activeWorkspaceId}
          onChange={handleWorkspaceChange}
          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-1.5 font-semibold cursor-pointer"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location Dropdown */}
      <div className="flex items-center space-x-1.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:inline">
          Store:
        </span>
        <select
          value={activeLocationId || 'all'}
          onChange={handleLocationChange}
          className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-1.5 font-medium cursor-pointer"
        >
          <option value="all">🌐 All Locations (Aggregated)</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} {loc.business_type ? `(${loc.business_type})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
