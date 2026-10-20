'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMapsLibrary, Map, Marker } from '@vis.gl/react-google-maps'
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
import { MapPin, Plus, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { extractPrimaryBusinessType } from '@/lib/helpers/place-helpers'
import { addLocationAction } from '@/app/actions/locations'
import type { Location } from '@/types/models'
import { useTranslation } from 'react-i18next'

export default function AddLocationModal({
  isOpen,
  setIsOpen,
  workspaceId,
  locations,
  refetch,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  workspaceId: string
  locations: Location[]
  refetch: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()

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

      if (!place.place_id || !place.geometry?.location) {
        setError(
          'Please select a valid location from the Google suggestion dropdown.',
        )
        return
      }

      setError(null)
      if (place.formatted_address) {
        setAddress(place.formatted_address)
      }
      if (place.name && !name) {
        setName(place.name)
      }
      setGooglePlaceId(place.place_id)

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      setLatitude(lat)
      setLongitude(lng)

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
    setError(null)

    // 1. Validate Google Place selection
    if (!googlePlaceId || latitude === null || longitude === null) {
      setError(
        'Please choose a valid address from the Google Maps dropdown suggestions.',
      )
      return
    }

    // 2. Check for duplicity against existing workspace locations
    const isDuplicate = locations.some(
      (loc) => loc.google_place_id === googlePlaceId,
    )

    if (isDuplicate) {
      setError('This location has already been added to this workspace.')
      return
    }

    if (!name.trim()) {
      setError('Please provide a location name or branch.')
      return
    }

    setSubmitting(true)

    try {
      const result = await addLocationAction({
        workspaceId: workspaceId,
        name: name.trim(),
        placeId: googlePlaceId,
        businessType: businessType || 'local business',
        address: address.trim(),
        latitude: latitude,
        longitude: longitude,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Reset form fields on success
      void refetch()
      setName('')
      setAddress('')
      setGooglePlaceId('')
      setLatitude(null)
      setLongitude(null)
      setBusinessType('local business')
      setIsOpen(false)

      router.refresh()
    } catch (err) {
      console.error('Error creating location:', err)
      setError(err instanceof Error ? err.message : 'Failed to create location.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className={buttonVariants({ variant: 'default' })}>
        <Plus className="w-4 h-4 mr-2" /> Add Location
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleCreateLocation}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> {t('locations.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('locations.addDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="address">{t('locations.mapSearch')}</Label>
              <Input
                ref={inputRef}
                id="address"
                placeholder={t('locations.addressPlaceholder')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {googlePlaceId && (
                <p className="text-xs font-medium text-emerald-400">
                  ✓ {t('locations.googleVerified')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t('locations.branchName')}</Label>
              <Input
                id="name"
                placeholder={t('locations.branchPlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Interactive Map Preview */}
            <div className="space-y-2">
              <Label>{t('locations.mapPreview')}</Label>
              <div className="w-full h-48 rounded-lg overflow-hidden border relative bg-muted">
                {latitude !== null &&
                longitude !== null &&
                !isNaN(latitude) &&
                !isNaN(longitude) ? (
                  <Map
                    key={`${latitude}-${longitude}`}
                    defaultCenter={{ lat: latitude, lng: longitude }}
                    center={{ lat: latitude, lng: longitude }}
                    defaultZoom={15}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    className="w-full h-full"
                  >
                    <Marker position={{ lat: latitude, lng: longitude }} />
                  </Map>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center text-xs">
                    <MapPin className="w-6 h-6 mb-1 opacity-40" />
                    {t('locations.mapPrompt')}
                  </div>
                )}
              </div>
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
