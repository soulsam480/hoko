import * as L from 'leaflet'
import { getMyMarket as getMyMarker, setMyMarker } from './map'
import { gpsSignal } from '../stores'

const options: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 27000
}

function pingLoc(map: L.Map, fly = false) {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (getMyMarker() === null) {
        setMyMarker(L.marker([coords.latitude, coords.longitude]).addTo(map))
      }

      if (fly) {
        map.zoomIn(5).flyTo({
          lat: coords.latitude,
          lng: coords.longitude
        })
      }
    },
    error => {
      console.log('ERROR', error)
    },
    options
  )
}

export function startGPS(map: L.Map) {
  pingLoc(map, true)

  window.setInterval(() => {
    pingLoc(map)
  }, 500)

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
