'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
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

export default function WorkspaceLocationsClient({
  workspaceId,
  initialWorkspace,
  initialLocations,
  workspaceRole,
}: {
  workspaceId: string
  initialWorkspace: any
  initialLocations: any[]
  workspaceRole: string
}) {
  const router = useRouter()
  const [locations, setLocations] = useState(initialLocations)
  const [isOpen, setIsOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const canManage = workspaceRole === 'owner' || workspaceRole === 'admin'

  const handleSync = async (location: any) => {
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
      setLocations(locations.filter((l) => l.id !== locId))
    } else {
      alert(res.error || 'Failed to delete location')
    }
  }

  const renderLocationCard = (loc: any) => {
    if (!loc.id) return
    const isSyncing = syncingId === loc.id

    return (
      <Card
        key={loc.id}
        className="hover:border-primary/50 transition-colors flex flex-col justify-between h-full"
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

        <CardContent className="pt-4 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between items-center">
          <button
            onClick={() => handleSync(loc)}
            disabled={isSyncing || !loc.google_place_id}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isSyncing ? 'Syncing...' : '🔄 Sync Reviews'}
          </button>

          <a
            href={`/dashboard/${workspaceId}/reviews?locationId=${loc.id}`}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            View Reviews →
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="space-y-8 max-w-6xl mx-auto">
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
                locations={locations}
                setLocations={setLocations}
              />
            )}
          </div>
        </div>

        {locations.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-6 h-6" />}
            title="No store locations yet"
            description="Add your first business address using Google Places autocomplete to start tracking reviews on the interactive map."
            actionLabel="Add First Location"
            onAction={() => setIsOpen(true)}
          />
        ) : locations.length <= 3 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => renderLocationCard(loc))}
          </div>
        ) : (
          <div className="px-6 md:px-12">
            <Carousel opts={{ align: 'start', loop: false }} className="w-full">
              <CarouselContent className="-ml-4">
                {locations.map((loc) => (
                  <CarouselItem
                    key={loc.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    {renderLocationCard(loc)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        {locations.length > 0 && <GoogleMaps locations={locations} />}
      </div>
      <EditLocationModal
        workspaceId={workspaceId}
        location={editingLocation}
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        onUpdated={(updatedLoc) => {
          setLocations(
            locations.map((l) => (l.id === updatedLoc.id ? updatedLoc : l)),
          )
        }}
      />
    </APIProvider>
  )
}
