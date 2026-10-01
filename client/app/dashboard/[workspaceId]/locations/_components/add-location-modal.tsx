import { useState, useEffect, useRef } from 'react'
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

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addressInputRef = useRef<HTMLInputElement>(null)

  // Initialize Google Places Autocomplete with geometry
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      if (window.google && addressInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            fields: ['place_id', 'formatted_address', 'name', 'geometry'],
          },
        )

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()

          if (place.name) setName(place.name) // Automatically set official Google name
          if (place.formatted_address) setAddress(place.formatted_address)
          if (place.place_id) setGooglePlaceId(place.place_id)

          if (place.geometry?.location) {
            setLatitude(place.geometry.location.lat())
            setLongitude(place.geometry.location.lng())
          }
        })
      }
    }, 100)

    return () => clearTimeout(timer)
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
          latitude: latitude || null,
          longitude: longitude || null,
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
                ref={addressInputRef}
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
