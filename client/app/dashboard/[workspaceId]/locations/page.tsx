'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MapPin, Plus, ArrowLeft, Store, Loader2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function WorkspaceLocationsPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const router = useRouter()
  const supabase = createClient()

  const [workspace, setWorkspace] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal & Form State
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [googlePlaceId, setGooglePlaceId] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

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

  // Initialize Google Places Autocomplete with geometry
  useEffect(() => {
    if (!isOpen) return

    if (!window.google || !autocompleteRef.current) return
    const autocomplete =
      new window.google.maps.places.PlaceAutocompleteElement()

    autocompleteRef.current.appendChild(autocomplete)

    autocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
      const place = placePrediction.toPlace()

      await place.fetchFields({
        fields: ['id', 'formattedAddress', 'displayName', 'location'],
      })

      if (place.id) {
        setGooglePlaceId(place.id)
      }

      if (place.formattedAddress) {
        setAddress(place.formattedAddress)
      }

      if (place.location) {
        setLatitude(place.location.lat())
        setLongitude(place.location.lng())
      }
    })

    return () => autocomplete.remove()
  }, [isOpen])

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('locations')
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          address: address.trim() || null,
          google_place_id: googlePlaceId || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setLocations([data, ...locations])
      setName('')
      setAddress('')
      setGooglePlaceId('')
      setLatitude(null)
      setLongitude(null)
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('Error creating location:', err)
      setError(err.message || 'Failed to create location.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Generate Google Static Maps URL securely using client env or key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  console.log(locations)
  const staticMapUrl =
    latitude && longitude && apiKey
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=500x160&markers=color:red%7C${latitude},${longitude}&key=${apiKey}`
      : null

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <Link href={`/dashboard/${workspaceId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to{' '}
            {workspace?.name || 'Workspace'} Dashboard
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
            <p className="text-muted-foreground text-sm">
              Manage physical storefronts and Google Places connections for{' '}
              {workspace?.name}.
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className={buttonVariants({ variant: 'default' })}>
              <Plus className="w-4 h-4 mr-2" /> Add Location
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleCreateLocation}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Add New Location
                  </DialogTitle>
                  <DialogDescription>
                    Search your business address to pin it precisely on the map.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Location Name / Branch</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Downtown Flagship Store"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2" ref={autocompleteRef}>
                    <Label htmlFor="address">
                      Google Maps Search / Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="Start typing your business address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    {googlePlaceId && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Google Place ID linked successfully
                      </p>
                    )}
                  </div>

                  {/* High-Performance Static Map Preview */}
                  {staticMapUrl && (
                    <div className="space-y-1 pt-2">
                      <Label className="text-xs text-muted-foreground">
                        Map Preview Confirmation
                      </Label>
                      <div className="rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={staticMapUrl}
                          alt="Selected location map preview"
                          className="w-full h-36 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{' '}
                        Saving...
                      </>
                    ) : (
                      'Save Location'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3 text-primary">
              <Store className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl">No locations found</CardTitle>
            <CardDescription className="max-w-sm mx-auto mt-1">
              You haven&apos;t added any business locations to this workspace
              yet. Click below to add your first location.
            </CardDescription>
            <div className="mt-6">
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Location
              </Button>
            </div>
          </CardHeader>
        </Card>
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
    </div>
  )
}
