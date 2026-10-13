// components/map/GoogleMaps.tsx
'use client'

import { useEffect } from 'react'
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps'

interface Location {
  id: string
  name: string
  latitude: number | string | null
  longitude: number | string | null
}

interface GoogleMapsProps {
  locations?: Location[]
}

const DEFAULT_FALLBACK_CENTER = { lat: 37.5665, lng: 126.978 }

// Internal helper component to adjust bounds based on markers safely
function MapBoundsController({ locations }: { locations: Location[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Ensure google.maps library is fully loaded before using LatLngBounds
    if (typeof window === 'undefined' || !window.google?.maps?.LatLngBounds) {
      return
    }

    // Filter and ensure coordinates parse into valid finite numbers
    const validLocations = locations.filter((loc) => {
      const lat = Number(loc.latitude)
      const lng = Number(loc.longitude)
      return (
        loc.latitude !== null &&
        loc.longitude !== null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      )
    })

    if (validLocations.length === 0) return

    const lat1 = Number(validLocations[0].latitude)
    const lng1 = Number(validLocations[0].longitude)

    // If there's only one location, center on it with a standard zoom
    if (validLocations.length === 1) {
      map.setCenter({ lat: lat1, lng: lng1 })
      map.setZoom(14)
      return
    }

    // If multiple locations, calculate bounds to fit all of them safely
    const bounds = new google.maps.LatLngBounds()
    validLocations.forEach((loc) => {
      bounds.extend({
        lat: Number(loc.latitude),
        lng: Number(loc.longitude),
      })
    })

    // Fit map to bounds with padding (in pixels)
    map.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    })
  }, [map, locations])

  return null
}

export default function GoogleMaps({ locations = [] }: GoogleMapsProps) {
  const validLocations = locations.filter((loc) => {
    const lat = Number(loc.latitude)
    const lng = Number(loc.longitude)
    return (
      loc.latitude !== null &&
      loc.longitude !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    )
  })

  const safeCenter = {
    lat:
      validLocations.length > 0
        ? Number(validLocations[0].latitude)
        : DEFAULT_FALLBACK_CENTER.lat,
    lng:
      validLocations.length > 0
        ? Number(validLocations[0].longitude)
        : DEFAULT_FALLBACK_CENTER.lng,
  }

  return (
    <div className="relative mt-6 h-80 w-full min-w-0 overflow-hidden rounded-xl border shadow-sm sm:mt-8 sm:h-[450px]">
      <Map
        defaultCenter={safeCenter}
        defaultZoom={12}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'DEMO_MAP_ID'}
        gestureHandling={'greedy'}
        disableFullscreenControl={false}
      >
        <MapBoundsController locations={locations} />
        {validLocations.map((loc, index) => {
          const lat = Number(loc.latitude)
          const lng = Number(loc.longitude)

          // Use a fallback composite key in case loc.id is duplicated or missing
          const uniqueKey = loc.id
            ? `${loc.id}-${index}`
            : `loc-marker-${index}`
          return (
            <AdvancedMarker
              key={uniqueKey}
              position={{ lat, lng }}
              title={loc.name}
            >
              <Pin
                background={'#0f172a'}
                glyphColor={'#ffffff'}
                borderColor={'#0f172a'}
              />
            </AdvancedMarker>
          )
        })}
      </Map>
    </div>
  )
}
