'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { APIProvider } from '@vis.gl/react-google-maps'
import GoogleMaps from '@/components/map/GoogleMaps'
import AddLocationModal from '@/app/dashboard/[workspaceId]/locations/_components/add-location-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { syncLocationReviews } from '@/app/actions/syncReviews'
import { deleteLocationAction } from '@/app/actions/locations'
import EditLocationModal from '@/app/dashboard/[workspaceId]/locations/_components/edit-location-modal'
import { useLocations } from '@/hooks/use-locations'
import type { Location, Workspace } from '@/types/models'

export default function WorkspaceLocationsClient({
  workspaceId,
  initialWorkspace,
  workspaceRole,
}: {
  workspaceId: string
  initialWorkspace: Pick<Workspace, 'id' | 'name'> | null
  workspaceRole: string
}) {
  const router = useRouter()
  const {
    data: locations,
    refetch,
  } = useLocations(workspaceId)
  const [isOpen, setIsOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const canManage = workspaceRole === 'owner' || workspaceRole === 'admin'

  const handleSync = async (location: Location) => {
    setSyncingId(location.id)
    try {
      const res = await syncLocationReviews(location.id, workspaceId)

      if (res.success) {
        router.refresh()
      } else {
        alert(`Sync failed: ${res.error}`)
      }
    } catch (error) {
      alert(
        `Sync failed: ${error instanceof Error ? error.message : 'Unexpected error'}`,
      )
    } finally {
      setSyncingId(null)
    }
  }

  const handleDeleteLocation = async (locId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this location and all its reviews?',
      )
    )
      return

    const res = await deleteLocationAction(locId, workspaceId)
    if (res.success) {
      refetch()
    } else {
      alert(res.error || 'Failed to delete location')
    }
  }

  const renderLocationCard = (loc: Location) => {
    if (!loc.id) return
    const isSyncing = syncingId === loc.id

    return (
      <Card
        key={loc.id}
        className="flex h-full flex-col justify-between border border-border ring-0 transition-colors hover:border-primary/50"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                {loc.google_place_id ? 'Google Linked' : 'Active'}
              </span>

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingLocation(loc)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit Location
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteLocation(loc.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete & Reviews
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <CardTitle className="text-lg mt-3 truncate">{loc.name}</CardTitle>
          <CardDescription className="text-xs truncate">
            {loc.address || 'No address specified'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-stretch gap-3 border-t bg-muted/10 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => handleSync(loc)}
            disabled={isSyncing || !loc.google_place_id}
            className="w-full cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
          >
            {isSyncing ? 'Syncing...' : '🔄 Sync Reviews'}
          </button>

          <a
            href={`/dashboard/${workspaceId}/reviews?locationId=${loc.id}`}
            className="inline-flex min-h-8 items-center justify-center text-center text-xs font-medium text-primary hover:text-primary/80 sm:text-right"
          >
            View Reviews →
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
              <p className="text-muted-foreground text-sm">
                Manage physical storefronts and Google Places connections for{' '}
                {initialWorkspace?.name}.
              </p>
            </div>
            {canManage && (
              <AddLocationModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                workspaceId={workspaceId}
                locations={locations ?? []}
                refetch={() => { void refetch() }}
              />
            )}
          </div>
        </div>

        {locations?.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-6 h-6" />}
            title="No store locations yet"
            description="Add your first business address using Google Places autocomplete to start tracking reviews on the interactive map."
            actionLabel="Add First Location"
            onAction={() => setIsOpen(true)}
          />
        ) : locations && locations.length <= 3 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {locations?.map((loc) => renderLocationCard(loc))}
          </div>
        ) : (
          <div className="relative w-full px-8 md:px-4">
            <Carousel opts={{ align: 'start', loop: false }} className="w-full">
              <CarouselContent className="-ml-4">
                {locations?.map((loc) => (
                  <CarouselItem
                    key={loc.id}
                    className="py-2 pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    {renderLocationCard(loc)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-2 md:-left-4 h-8 w-8 cursor-pointer" />
              <CarouselNext className="-right-2 md:-right-4 h-8 w-8 cursor-pointer" />
            </Carousel>
          </div>
        )}

        {locations && locations?.length > 0 && (
          <GoogleMaps locations={locations} />
        )}
      </div>
      <EditLocationModal
        key={editingLocation?.id ?? 'no-location'}
        workspaceId={workspaceId}
        location={editingLocation}
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        onUpdated={() => { void refetch() }}
      />
    </APIProvider>
  )
}
