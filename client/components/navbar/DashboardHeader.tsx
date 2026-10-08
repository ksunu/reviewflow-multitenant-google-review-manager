// src/components/navbar/DashboardHeader.tsx
'use client'

import React, { useEffect, useState } from 'react'
import {
  useRouter,
  usePathname,
  useParams,
  useSearchParams,
} from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()

  const activeWorkspaceId = params.workspaceId as string
  const activeLocationId = searchParams.get('locationId')

  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Check if we are strictly on the base workspace dashboard (e.g. /dashboard/ws-123)
  // and NOT on sub-pages like /dashboard/ws-123/reviews or /dashboard/ws-123/locations
  const isInWorkspace = Boolean(
    activeWorkspaceId &&
    pathname?.startsWith(`/dashboard/${activeWorkspaceId}`),
  )
  useEffect(() => {
    async function loadHeaderData() {
      try {
        // 1. Fetch user's workspaces
        const { data: memberData } = await supabase
          .from('workspace_members')
          .select('workspaces(id, name)')

        const userWorkspaces =
          memberData?.map((m: any) => m.workspaces).filter(Boolean) || []
        setWorkspaces(userWorkspaces)

        // 2. Fetch locations for the active workspace path slug
        if (activeWorkspaceId) {
          const { data: locs } = await supabase
            .from('locations')
            .select('id, name, business_type')
            .eq('workspace_id', activeWorkspaceId)
            .order('created_at', { ascending: false })

          setLocations(locs || [])
        }
      } catch (err) {
        console.error('Error fetching header data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadHeaderData()
  }, [activeWorkspaceId])

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWsId = e.target.value
    const newPathname = pathname.replace(
      `/dashboard/${activeWorkspaceId}`,
      `/dashboard/${newWsId}`,
    )
    router.push(newPathname)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocId = e.target.value
    const search = new URLSearchParams(searchParams.toString())

    if (newLocId === 'all') {
      search.delete('locationId')
    } else {
      search.set('locationId', newLocId)
    }

    router.push(`${pathname}?${search.toString()}`)
  }

  return (
    <div>
      {/* Conditionally render the dropdown selectors ONLY on the root workspace dashboard */}
      {isInWorkspace && !loading && (
        <div className="flex items-center space-x-3 animate-fade-in">
          {/* Workspace Dropdown */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
              Org:
            </span>
            <select
              value={activeWorkspaceId || ''}
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
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
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
      )}
    </div>
  )
}
