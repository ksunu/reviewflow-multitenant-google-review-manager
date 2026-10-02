import { useState, useEffect, useRef, useCallback } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button, buttonVariants } from '@/components/ui/button'
import { MapPin, Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { extractPrimaryBusinessType } from '@/lib/helpers/place-helpers'

export default function AddLocationModal({
  isOpen,
  setIsOpen,
  workspaceId,
  locations,
  setLocations,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  workspaceId: string
  locations: any[]
  setLocations: (locations: any[]) => void
}) {
  const router = useRouter()
  const supabase = createClient()

  // Modal & Form State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [googlePlaceId, setGooglePlaceId] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [businessType, setBusinessType] = useState('local business')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the places library using vis.gl hook
  const placesLibrary = useMapsLibrary('places')
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null)

  // Use a callback ref so Autocomplete attaches the exact moment the input mounts in the DOM portal
  const inputRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (!node || !placesLibrary) return

      const ak = new placesLibrary.Autocomplete(node, {
        fields: ['place_id', 'formatted_address', 'name', 'geometry', 'types'],
      })

      setAutocomplete(ak)
    },
    [placesLibrary],
  )

  useEffect(() => {
    if (!autocomplete) return

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()

      if (place.formatted_address) {
        setAddress(place.formatted_address)
      }
      if (place.name && !name) {
        setName(place.name)
      }
      if (place.place_id) {
        setGooglePlaceId(place.place_id)
      }
      if (place.geometry?.location) {
        setLatitude(place.geometry.location.lat())
        setLongitude(place.geometry.location.lng())
      }
      if (place.types) {
        const primaryType = extractPrimaryBusinessType(place.types)
        setBusinessType(primaryType)
      }
    })

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(listener)
      }
    }
  }, [autocomplete, name])

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
          latitude: latitude || null,
          longitude: longitude || null,
          business_type: businessType,
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
      setBusinessType('local business')
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('Error creating location:', err)
      setError(err.message || 'Failed to create location.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
            <div className="space-y-2">
              <Label htmlFor="address">Google Maps Search / Address</Label>
              <Input
                ref={inputRef}
                id="address"
                placeholder="Start typing your business address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {googlePlaceId && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Google Place ID & {businessType} linked successfully
                </p>
              )}
            </div>
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                'Save Location'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
