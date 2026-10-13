// src/components/navbar/DashboardHeader.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  useRouter,
  usePathname,
  useParams,
  useSearchParams,
} from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const activeWorkspaceName = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  )?.name
  const activeLocation = locations.find(
    (location) => location.id === activeLocationId,
  )
  const activeLocationName = activeLocationId
    ? activeLocation
      ? `${activeLocation.name}${activeLocation.business_type ? ` (${activeLocation.business_type})` : ''}`
      : 'Location'
    : '🌐 All Locations (Aggregated)'

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

  const handleWorkspaceChange = (newWsId: string | null) => {
    if (!newWsId) return

    const newPathname = pathname.replace(
      `/dashboard/${activeWorkspaceId}`,
      `/dashboard/${newWsId}`,
    )
    router.push(newPathname)
  }

  const handleLocationChange = (newLocId: string | null) => {
    if (!newLocId) return

    const search = new URLSearchParams(searchParams.toString())

    if (newLocId === 'all') {
      search.delete('locationId')
    } else {
      search.set('locationId', newLocId)
    }

    router.push(`${pathname}?${search.toString()}`)
  }

  return (
    <div className="min-w-0">
      {/* Conditionally render the dropdown selectors ONLY on the root workspace dashboard */}
      {isInWorkspace && !loading && (
        <div className="flex min-w-0 items-center gap-1 sm:gap-3 animate-fade-in">
          {/* Workspace Dropdown */}
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
              Org:
            </span>
            <Select
              value={activeWorkspaceId || ''}
              onValueChange={handleWorkspaceChange}
            >
              <SelectTrigger className="w-[5.5rem] min-w-0 border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-gray-900 focus-visible:border-indigo-500 focus-visible:ring-indigo-500 min-[380px]:w-[6.5rem] sm:w-[10rem] sm:px-3 sm:text-sm lg:w-[12rem]">
                <SelectValue>
                  {activeWorkspaceName || 'Workspace'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Dropdown */}
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
              Store:
            </span>
            <Select
              value={activeLocationId || 'all'}
              onValueChange={handleLocationChange}
            >
              <SelectTrigger className="w-[6.5rem] min-w-0 border-gray-200 bg-white px-2 text-xs font-medium text-gray-900 focus-visible:border-indigo-500 focus-visible:ring-indigo-500 min-[380px]:w-[7.5rem] sm:w-[11rem] sm:px-3 sm:text-sm lg:w-[14rem]">
                <SelectValue>{activeLocationName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  🌐 All Locations (Aggregated)
                </SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}{' '}
                    {loc.business_type ? `(${loc.business_type})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
