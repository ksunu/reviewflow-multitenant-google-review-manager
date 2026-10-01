'use client'

import { useEffect } from 'react'
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps'

interface Location {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
}

interface GoogleMapsProps {
  locations?: Location[]
}

// Internal helper component to adjust bounds based on markers
function MapBoundsController({ locations }: { locations: Location[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const validLocations = locations.filter(
      (loc) => loc.latitude !== null && loc.longitude !== null,
    )

    if (validLocations.length === 0) return

    // If there's only one location, center on it with a standard zoom
    if (validLocations.length === 1) {
      map.setCenter({
        lat: validLocations[0].latitude!,
        lng: validLocations[0].longitude!,
      })
      map.setZoom(14)
      return
    }

    // If multiple locations, calculate bounds to fit all of them
    const bounds = new google.maps.LatLngBounds()
    validLocations.forEach((loc) => {
      bounds.extend({ lat: loc.latitude!, lng: loc.longitude! })
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
  const validLocations = locations.filter(
    (loc) => loc.latitude !== null && loc.longitude !== null,
  )

  const defaultCenter =
    validLocations.length > 0
      ? { lat: validLocations[0].latitude!, lng: validLocations[0].longitude! }
      : { lat: 37.5665, lng: 126.978 } // Default fallback (e.g., Seoul)

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border shadow-sm mt-8 relative">
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={12}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID'}
        gestureHandling={'greedy'}
        disableFullscreenControl={false}
      >
        <MapBoundsController locations={locations} />
        {validLocations.map((loc) => (
          <AdvancedMarker
            key={loc.id}
            position={{ lat: loc.latitude!, lng: loc.longitude! }}
            title={loc.name}
          >
            <Pin
              background={'#0f172a'}
              glyphColor={'#ffffff'}
              borderColor={'#0f172a'}
            />
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  )
}
