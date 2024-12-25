import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { effect } from '@preact/signals'
import { isReady } from './db/browser'
import { getClosestStops } from './db/browser/queries'
import { gpsSignal, chosenStop, closestStops } from './stores'
import { render } from 'preact'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'
import { getUserId } from './userId'

const USER_ID = getUserId()

// L.Icon.Default.imagePath = "img/icon/";

const options: PositionOptions = {
  enableHighAccuracy: true,
  // maximumAge: 30000,
  timeout: 27000
}

// NOTE: 1. stores

const map = L.map('app', {
  // center bengaluru
  center: [12.9542802, 77.4661305],
  zoom: 12,
  zoomControl: true
})

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  crossOrigin: true,
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

L.control
  .scale({
    imperial: false,
    maxWidth: 300
  })
  .addTo(map)

let myMarker: L.Marker | null = null

effect(() => {
  const loc = gpsSignal.value

  if (loc === null) {
    return
  }

  const { latitude, longitude } = loc

  if (myMarker === null) {
    myMarker = L.marker([latitude, longitude]).addTo(map)
  }

  myMarker.setLatLng({
    lat: latitude,
    lng: longitude
  })

  if (chosenStop.peek() === null) {
    isReady().then(async () => {
      closestStops.value = await getClosestStops(loc)
    })
  }
})

navigator.geolocation.getCurrentPosition(
  ({ coords }) => {
    if (myMarker === null) {
      myMarker = L.marker([coords.latitude, coords.longitude]).addTo(map)
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

render(
  // <ErrorBoundary fallback={({ error }) => {
  //   logger.warn('[UI]: ', error)

  //   return 'ERROR'
  // }}
  // >
  <App />,
  // </ErrorBoundary>
  document.getElementById('hoko-controls')!
)

registerSW({ immediate: true })
