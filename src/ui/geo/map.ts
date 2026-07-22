import { effect } from '@preact/signals'
import * as L from 'leaflet'

import { connection } from '../connection'
import { closestStops, gpsSignal, chosenStop } from '../stores'
import { getClosestStops } from '../../db/quries'
import { isReady } from '../../db/client'
let myMarker: L.Marker | null = null
let map: L.Map | null = null

export function setMyMarker(marker: L.Marker) {
  myMarker = marker
}

export function getMyMarket() {
  return myMarker
}

export function renderMap() {
  map = L.map('app', {
    // center Bangalore
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

  effect(() => {
    const loc = gpsSignal.value

    if (loc === null || connection.isTrackingInProgress) {
      return
    }

    const { latitude, longitude } = loc

    if (myMarker === null) {
      myMarker = L.marker([latitude, longitude]).addTo(map!)
    }

    myMarker.setLatLng({
      lat: latitude,
      lng: longitude
    })

    isReady().then(() => {
      getClosestStops(loc).then(res => {
        closestStops.value = res
      })
    })
  })

  return { map, myMarker }
}

const stopMarkers = new Map<number, L.CircleMarker>()

effect(() => {
  const stops = closestStops.value
  if (map === null) return

  for (const [id, marker] of stopMarkers) {
    if (!stops.find(s => s.id === id)) {
      marker.remove()
      stopMarkers.delete(id)
    }
  }

  for (const stop of stops) {
    let marker = stopMarkers.get(stop.id)
    if (!marker) {
      marker = L.circleMarker([stop.lat, stop.lon], {
        radius: 7,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.85
      }).addTo(map)

      marker.bindTooltip(stop.name, { direction: 'top' })
      marker.on('click', () => {
        chosenStop.value = stop
      })

      stopMarkers.set(stop.id, marker)
    }
    marker.setLatLng([stop.lat, stop.lon])
  }
})
