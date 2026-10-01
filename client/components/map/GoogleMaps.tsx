import { Map } from '@vis.gl/react-google-maps'

interface GoogleMapsProps {
  latitude?: number
  longitude?: number
}

export default function GoogleMaps({ latitude, longitude }: GoogleMapsProps) {
  return (
    <Map
      style={{ width: '100%', height: '300px' }}
      defaultCenter={{ lat: 22.54992, lng: 0 }}
      defaultZoom={3}
      gestureHandling="greedy"
      disableDefaultUI
    />
  )
}
