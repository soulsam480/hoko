import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { isReady } from '../../db/client'
import { getClosestStops, getStopsForRoute } from '../../db/queries'
import { clusterFeeders, haversine } from '../../lib/coordinates'
import { connection } from '../connection'
import {
  chosenRoute,
  chosenStop,
  closestStops,
  connectionState,
  feeders,
  gpsSignal
} from '../stores'

let myMarker: L.Marker | null = null
let map: L.Map | null = null

const STOP_ICON = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path d="M12 2C7.58 2 4 5.58 4 10c0 5.54 8 12 8 12s8-6.46 8-12c0-4.42-3.58-8-8-8z" fill="#ef4444" stroke="#fff" stroke-width="2"/>
    <circle cx="12" cy="10" r="3" fill="#fff"/>
  </svg>`,
  iconSize: [24, 28],
  iconAnchor: [12, 26],
  tooltipAnchor: [0, -14]
})

const BUS_ICON = L.divIcon({
  className: 'bus-marker-wrapper',
  html: `<div class="bus-beacon"></div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="6" width="26" height="14" rx="3.5" fill="#2563eb" stroke="#fff" stroke-width="1.5"/>
      <circle cx="7" cy="21" r="3" fill="#fff"/>
      <circle cx="21" cy="21" r="3" fill="#fff"/>
      <rect x="4" y="8" width="8" height="5" rx="1.5" fill="#93c5fd" opacity="0.5"/>
      <rect x="16" y="8" width="8" height="5" rx="1.5" fill="#93c5fd" opacity="0.5"/>
    </svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  tooltipAnchor: [0, -14]
})

function clusterBusIcon(count: number) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="#fff" stroke-width="2.5"/>
      <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">${count}</text>
    </svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    tooltipAnchor: [0, -20]
  })
}

export function renderMap() {
  map = L.map('app', {
    center: [12.9542802, 77.4661305],
    zoom: 12,
    zoomControl: true
  })

  // light mode => https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
  // dark mode => https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    crossOrigin: true,
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  L.control.scale({ imperial: false, maxWidth: 300 }).addTo(map)

  let hasFlown = false

  effect(() => {
    const loc = gpsSignal.value
    if (loc === null) return

    connection.updatePosition(loc)

    const { latitude, longitude } = loc

    if (myMarker === null) {
      myMarker = L.marker([latitude, longitude]).addTo(map!)
    }

    myMarker.setLatLng({ lat: latitude, lng: longitude })

    if (!hasFlown) {
      hasFlown = true
      map!.zoomIn(5).flyTo({ lat: latitude, lng: longitude })
    }

    isReady().then(() => {
      getClosestStops(loc).then(res => {
        closestStops.value = res
      })
    })
  })

  return { map, myMarker }
}

export function recenterMap() {
  const loc = gpsSignal.value
  if (!map || !loc) return
  map.flyTo({ lat: loc.latitude, lng: loc.longitude })
}

// Revive tracking after page reload — only if near route stops
let reviving = false

effect(() => {
  if (reviving) return
  const route = chosenRoute.value
  const stop = chosenStop.value
  const loc = gpsSignal.value

  if (!route || !stop || !loc) return
  if (connectionState.value !== 'idle') return

  reviving = true
  isReady().then(async () => {
    try {
      const stopsOnRoute = await getStopsForRoute(route.id)
      const near = stopsOnRoute.some(
        s => haversine(loc.latitude, loc.longitude, s.lat, s.lon) < 300
      )

      if (near && connectionState.value === 'idle') {
        connection.joinRoute(route)
      } else if (connectionState.value === 'idle') {
        chosenRoute.value = null
        chosenStop.value = null
      }
    } catch {
      if (connectionState.value === 'idle') {
        chosenRoute.value = null
        chosenStop.value = null
      }
    } finally {
      reviving = false
    }
  })
})

const stopMarkers = new Map<number, L.Marker>()

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
      marker = L.marker([stop.lat, stop.lon], {
        icon: STOP_ICON
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

const busMarkers = new Map<string, L.Marker>()

effect(() => {
  const currentFeeders = feeders.value
  if (map === null) return

  const clusters = clusterFeeders(currentFeeders, 50)

  const clusterKeys = new Set(clusters.map(c => c.ids.join(',')))
  for (const [key, marker] of busMarkers) {
    if (!clusterKeys.has(key)) {
      marker.remove()
      busMarkers.delete(key)
    }
  }

  for (const cluster of clusters) {
    const key = cluster.ids.join(',')
    let marker = busMarkers.get(key)

    if (cluster.count > 1) {
      if (!marker) {
        marker = L.marker(cluster.center, {
          icon: clusterBusIcon(cluster.count)
        }).addTo(map)

        marker.bindTooltip(`${cluster.count} buses`, { direction: 'top' })
        busMarkers.set(key, marker)
      }
      marker.setLatLng(cluster.center)
    } else {
      if (!marker) {
        marker = L.marker(cluster.center, { icon: BUS_ICON }).addTo(map)
        marker.bindTooltip('', { direction: 'top' })
        busMarkers.set(key, marker)
      }
      marker.setLatLng(cluster.center)

      const feeder = currentFeeders.find(f => f.userId === cluster.ids[0])
      const secondsAgo = feeder
        ? Math.round((Date.now() - feeder.lastSeen) / 1000)
        : 0
      marker.setTooltipContent(`Bus · ${secondsAgo}s ago`)
    }
  }
})
