import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { isReady } from '../db/browser'
import { getClosestStops } from '../db/browser/queries'
import { gpsSignal, chosenStop, closestStops, trackingMeta } from '../ui/stores'
import { IConsumableFeeder } from '../messages'

let myMarker: L.Marker | null = null
let map: L.Map | null = null

export function setMyMarker(marker: L.Marker) {
  myMarker = marker
}

export function getMyMarket() {
  return myMarker
}

export function renderMap() {
  // L.Icon.Default.imagePath = "img/icon/";

  map = L.map('app', {
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

  effect(() => {
    const loc = gpsSignal.value

    if (loc === null) {
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

const feederMarkers = new Map<string, L.Marker>()

function syncMarkers(feeders: IConsumableFeeder[]) {
  if (map === null) {
    return
  }

  feederMarkers.keys().forEach(it => {
    if (!feeders.find(item => it !== item.id)) {
      const mark = feederMarkers.get(it)
      feederMarkers.delete(it)
      mark?.remove()
    }
  })

  for (const feeder of feeders) {
    let marker = feederMarkers.get(feeder.id)

    if (!marker) {
      marker = L.marker(feeder.coordinates, { title: feeder.id })
      marker.addTo(map)
    }

    marker.setLatLng(feeder.coordinates)
  }
}

effect(() => {
  if (trackingMeta.value === null) {
    return
  }

  syncMarkers(trackingMeta.value.feeders)
})
