import { gpsSignal } from '../stores'

const options: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 27000
}

export function startGPS() {
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
