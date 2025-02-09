import * as L from 'leaflet'
import { getMyMarket as getMyMarker, setMyMarker } from './map'
import { gpsSignal } from '../stores'

const options: PositionOptions = {
  enableHighAccuracy: true,
  // maximumAge: 30000,
  timeout: 27000
}

export function startGPS(map: L.Map) {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (getMyMarker() === null) {
        setMyMarker(L.marker([coords.latitude, coords.longitude]).addTo(map))
      }

      map.zoomIn(5).flyTo({
        lat: coords.latitude,
        lng: coords.longitude
      })
    },
    error => {
      console.log('ERROR', error)
    },
    options
  )

  navigator.geolocation.watchPosition(
    ({ coords }) => {
      gpsSignal.value = coords
    },
    error => {
      console.log('ERROR', error)
    },
    options
  )
}
