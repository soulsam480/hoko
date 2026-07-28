import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { isReady } from '../../db/client'
import {
  getClosestStops,
  getRoutesForStop,
  getStopsForRoute
} from '../../db/queries'
import { clusterFeeders, haversine } from '../../lib/coordinates'
import { connection } from '../connection'
import {
  chosenRoute,
  chosenStop,
  closestStops,
  connectionState,
  drawerOpen,
  type FeederPresence,
  feeders,
  gpsSignal,
  mapMode,
  presenceIndex,
  stopRoutes,
  TTheme,
  theme
} from '../stores'
import { USER_ID } from '../userId'

let myMarker: L.Marker | null = null
let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null

const TILE_URLS: Record<TTheme, string> = {
  dracula: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  lemonade: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
}

const STOP_MARKERS = new Map<number, L.Marker>()
const BUS_MARKERS = new Map<string, L.Marker>()
const DISCOVER_MARKERS = new Map<string, L.Marker>()

const STOP_ICON = L.divIcon({
  className: '',
  html: `<div class="flex flex-col items-center justify-center w-5 h-5 rounded-full"><span class="active-ping absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span><svg viewBox="0 0 32 32" width="1.2em" height="1.2em" class="w-4 h-4"><path fill="currentColor" d="M27 11h2v4h-2zM3 11h2v4H3zm17 9h2v2h-2zm-10 0h2v2h-2z"></path><path fill="currentColor" d="M21 4H11a5.006 5.006 0 0 0-5 5v14a2 2 0 0 0 2 2v3h2v-3h12v3h2v-3a2.003 2.003 0 0 0 2-2V9a5.006 5.006 0 0 0-5-5m3 6v6H8v-6ZM11 6h10a2.995 2.995 0 0 1 2.816 2H8.184A2.995 2.995 0 0 1 11 6M8 23v-5h16.001l.001 5Z"></path></svg></div>`,
  iconSize: [20, 20],
  iconAnchor: [12, 26],
  tooltipAnchor: [0, -20]
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

const PRESENCE_ICON = L.divIcon({
  className: 'bus-marker-wrapper',
  html: `<div class="bus-beacon"></div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="6" width="26" height="14" rx="3.5" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
      <circle cx="7" cy="21" r="3" fill="#fff"/>
      <circle cx="21" cy="21" r="3" fill="#fff"/>
      <rect x="4" y="8" width="8" height="5" rx="1.5" fill="#86efac" opacity="0.5"/>
      <rect x="16" y="8" width="8" height="5" rx="1.5" fill="#86efac" opacity="0.5"/>
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

function clusterPresenceIcon(count: number) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#16a34a" stroke="#fff" stroke-width="2.5"/>
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
    zoomControl: false
  })

  const currentTheme = theme.value
  tileLayer = L.tileLayer(TILE_URLS[currentTheme], {
    crossOrigin: true,
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map)

  document.documentElement.setAttribute('data-theme', currentTheme)

  L.control.scale({ imperial: false, maxWidth: 300 }).addTo(map)

  let hasFlown = false

  effect(() => {
    const currentTheme = theme.value
    if (tileLayer && map) {
      map.removeLayer(tileLayer)
      tileLayer = L.tileLayer(TILE_URLS[currentTheme], {
        crossOrigin: true,
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map)
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
  })

  effect(() => {
    const loc = gpsSignal.value

    if (loc === null) {
      return
    }

    connection.updatePosition(loc)

    const { latitude, longitude } = loc

    if (myMarker === null && map) {
      myMarker = L.marker([latitude, longitude]).addTo(map)
      myMarker.setIcon(
        L.divIcon({
          className: '',
          html: `<span class="relative flex size-4">
  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75"></span>
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="var(--color-info)"/><path fill="var(--color-info)" d="M16 30a14 14 0 1 1 14-14a14.016 14.016 0 0 1-14 14m0-26a12 12 0 1 0 12 12A12.014 12.014 0 0 0 16 4"/></svg>
</span>`,
          iconSize: [20, 20],
          iconAnchor: [20, 20],
          tooltipAnchor: [0, -20]
        })
      )
    }

    myMarker?.setLatLng({ lat: latitude, lng: longitude })

    if (!hasFlown) {
      hasFlown = true
      map?.zoomIn(5).flyTo({ lat: latitude, lng: longitude })
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

export function flyToStop(id: number) {
  const marker = STOP_MARKERS.get(id)

  if (!marker) {
    return
  }

  map?.flyTo(marker.getLatLng())
}

export function flyToFeeder(lat: number, lon: number) {
  map?.flyTo({ lat, lng: lon })
}

// Revive tracking after page reload — only if near route stops
let reviving = false

effect(() => {
  if (reviving) return
  const route = chosenRoute.value
  const stop = chosenStop.value
  const loc = gpsSignal.value

  if (!route || !stop || !loc) {
    if (route && !stop) {
      chosenRoute.value = null
    }
    return
  }
  if (connectionState.value !== 'idle') return

  reviving = true
  isReady().then(async () => {
    try {
      const stopsOnRoute = await getStopsForRoute(route.id)
      const near = stopsOnRoute.some(
        s => haversine(loc.latitude, loc.longitude, s.lat, s.lon) < 300
      )

      if (near && connectionState.value === 'idle') {
        const routes = await getRoutesForStop(stop.id)
        stopRoutes.value = routes
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

let lastMarker: L.Marker | null = null

function clearLastMarker() {
  if (lastMarker) {
    lastMarker.getElement()?.removeAttribute('data-active')

    lastMarker = null
  }
}

effect(() => {
  const stop = chosenStop.value

  if (!stop) {
    clearLastMarker()
    return
  }

  const activeMarker = STOP_MARKERS.get(stop.id)

  if (!activeMarker) {
    clearLastMarker()
    return
  }

  lastMarker?.getElement()?.removeAttribute('data-active')
  activeMarker.getElement()?.setAttribute('data-active', 'true')

  lastMarker = activeMarker
})

effect(() => {
  const stops = closestStops.value

  if (map === null) {
    return
  }

  for (const [id, marker] of STOP_MARKERS) {
    if (!stops.find(s => s.id === id)) {
      marker.remove()
      STOP_MARKERS.delete(id)
    }
  }

  for (const stop of stops) {
    let marker = STOP_MARKERS.get(stop.id)

    if (!marker) {
      marker = L.marker([stop.lat, stop.lon], {
        icon: STOP_ICON
      }).addTo(map)

      marker.getElement()?.classList.add('stop-marker')
      marker.bindTooltip(stop.name, { direction: 'top' })

      marker.on('click', () => {
        chosenStop.value = stop
        drawerOpen.value = true
        isReady().then(() =>
          getRoutesForStop(stop.id).then(routes => {
            stopRoutes.value = routes
          })
        )
      })

      STOP_MARKERS.set(stop.id, marker)
    }

    marker.setLatLng([stop.lat, stop.lon])
  }
})

// Discovery feeders — presence-based markers
effect(() => {
  const mode = mapMode.value
  const routes = stopRoutes.value

  if (map === null) return

  // Clear discovery markers when not in discovery mode
  if (mode !== 'discovery' || routes.length === 0) {
    for (const [, marker] of DISCOVER_MARKERS) {
      marker.remove()
    }
    DISCOVER_MARKERS.clear()
    return
  }

  const routeIds = new Set(routes.map(r => r.id))
  const index = presenceIndex.value
  const filtered: FeederPresence[] = []
  for (const [routeId, feeders] of index) {
    if (routeIds.has(routeId)) {
      filtered.push(
        ...feeders.filter(
          f => Date.now() - f.lastSeen < 90_000 && f.userId !== USER_ID
        )
      )
    }
  }

  const clusters = clusterFeeders(filtered, 50)
  const clusterKeys = new Set(
    clusters.map(c => `${c.routeId}:${c.ids.join(',')}`)
  )

  // Remove stale markers
  for (const [key, marker] of DISCOVER_MARKERS) {
    if (!clusterKeys.has(key)) {
      marker.remove()
      DISCOVER_MARKERS.delete(key)
    }
  }

  // Create/update markers
  for (const cluster of clusters) {
    const key = `${cluster.routeId}:${cluster.ids.join(',')}`
    let marker = DISCOVER_MARKERS.get(key)

    if (cluster.count > 1) {
      if (!marker) {
        marker = L.marker(cluster.center, {
          icon: clusterPresenceIcon(cluster.count)
        }).addTo(map)
        marker.bindTooltip(`${cluster.count} buses`, { direction: 'top' })
        DISCOVER_MARKERS.set(key, marker)
      }
      marker.setLatLng(cluster.center)
    } else {
      if (!marker) {
        marker = L.marker(cluster.center, { icon: PRESENCE_ICON }).addTo(map)
        marker.bindTooltip('', { direction: 'top' })
        DISCOVER_MARKERS.set(key, marker)
      }
      marker.setLatLng(cluster.center)

      const feeder = filtered.find(f => f.userId === cluster.ids[0])
      const secondsAgo = feeder
        ? Math.round((Date.now() - feeder.lastSeen) / 1000)
        : 0
      marker.setTooltipContent(`Bus · ${secondsAgo}s ago`)
    }

    marker.off('click')
    marker.on('click', async () => {
      const route = routes.find(r => r.id === cluster.routeId)
      if (route) {
        chosenRoute.value = route
        drawerOpen.value = true
        await connection.joinRoute(route)
      }
    })
  }
})

// GPS feeders — only visible in tracking mode
effect(() => {
  const mode = mapMode.value
  const currentFeeders = feeders.value
  if (map === null) return

  // Clear GPS markers when not tracking
  if (mode !== 'tracking' || currentFeeders.length === 0) {
    for (const [, marker] of BUS_MARKERS) {
      marker.remove()
    }
    BUS_MARKERS.clear()
    return
  }

  const clusters = clusterFeeders(
    currentFeeders.map(f => ({
      ...f,
      routeId: chosenRoute.value?.id ?? 0,
      lastSeen: f.lastSeen
    })) as FeederPresence[],
    50
  )

  const clusterKeys = new Set(
    clusters.map(c => `${c.routeId}:${c.ids.join(',')}`)
  )
  for (const [key, marker] of BUS_MARKERS) {
    if (!clusterKeys.has(key)) {
      marker.remove()
      BUS_MARKERS.delete(key)
    }
  }

  for (const cluster of clusters) {
    const key = `${cluster.routeId}:${cluster.ids.join(',')}`
    let marker = BUS_MARKERS.get(key)

    if (cluster.count > 1) {
      if (!marker) {
        marker = L.marker(cluster.center, {
          icon: clusterBusIcon(cluster.count)
        }).addTo(map)
        marker.bindTooltip(`${cluster.count} buses`, { direction: 'top' })
        BUS_MARKERS.set(key, marker)
      }
      marker.setLatLng(cluster.center)
    } else {
      if (!marker) {
        marker = L.marker(cluster.center, { icon: BUS_ICON }).addTo(map)
        marker.bindTooltip('', { direction: 'top' })
        BUS_MARKERS.set(key, marker)
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
