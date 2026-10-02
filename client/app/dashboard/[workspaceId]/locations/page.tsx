'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus, ArrowLeft, Store, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { APIProvider } from '@vis.gl/react-google-maps'
import GoogleMaps from '@/components/map/GoogleMaps'
import AddLocationModal from '@/app/dashboard/[workspaceId]/locations/_components/add-location-modal'
import { EmptyState } from '@/components/ui/empty-state'

export default function WorkspaceLocationsPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const [workspace, setWorkspace] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal & Form State
  const [isOpen, setIsOpen] = useState(false)

  // Fetch data client-side
  useEffect(() => {
    async function loadData() {
      try {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single()

        setWorkspace(ws)

        const { data: locs } = await supabase
          .from('locations')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })

        setLocations(locs || [])
      } catch (err) {
        console.error('Error loading locations:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [workspaceId, supabase])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
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
                {workspace?.name}.
              </p>
            </div>
            <AddLocationModal
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              workspaceId={workspaceId}
              locations={locations}
              setLocations={setLocations}
            />
          </div>
        </div>

        {/* Locations Grid */}
        {locations.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-6 h-6" />}
            title="No store locations yet"
            description="Add your first business address using Google Places autocomplete to start tracking reviews on the interactive map."
            actionLabel="Add First Location"
            onAction={() => setIsOpen(true)} // or point to your open modal function
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => (
              <Card
                key={loc.id}
                className="hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                      {loc.google_place_id ? 'Google Linked' : 'Active'}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-3">{loc.name}</CardTitle>
                  <CardDescription className="text-xs truncate">
                    {loc.address || 'No address specified'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between items-center">
                  <span className="font-mono">ID: {loc.id.slice(0, 8)}...</span>
                  <span className="font-medium text-foreground">0 reviews</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <GoogleMaps locations={locations} />
      </div>
    </APIProvider>
  )
}
