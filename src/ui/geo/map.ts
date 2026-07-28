import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { isReady } from '../../db/client'
import {
  getClosestStops,
  getRoutesForStop,
  getStopsForRoute
} from '../../db/queries'
import { haversine } from '../../lib/coordinates'
import { connection } from '../connection'
import {
  chosenRoute,
  chosenStop,
  closestStops,
  connectionState,
  gpsSignal,
  stopRoutes
} from '../stores'
import { DiscoveryTracker } from './discovery-tracker'
import { StopMarkerManager } from './stop-marker-manager'
import { TileManager } from './tile-manager'
import { TrackingTracker } from './tracking-tracker'

const MY_MARKER_ICON = L.divIcon({
  className: '',
  html: `<span class="relative flex size-4">
  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75"></span>
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="var(--color-info)"/><path fill="var(--color-info)" d="M16 30a14 14 0 1 1 14-14a14.016 14.016 0 0 1-14 14m0-26a12 12 0 1 0 12 12A12.014 12.014 0 0 0 16 4"/></svg>
</span>`,
  iconSize: [20, 20],
  iconAnchor: [20, 20],
  tooltipAnchor: [0, -20]
})

class MapManager {
  readonly map: L.Map
  private myMarker: L.Marker | null = null
  private tileManager: TileManager
  private stopMarkers: StopMarkerManager
  private discoveryTracker: DiscoveryTracker
  private trackingTracker: TrackingTracker

  constructor() {
    this.map = L.map('app', {
      center: [12.9542802, 77.4661305],
      zoom: 12,
      zoomControl: false
    })

    this.tileManager = new TileManager(this.map)
    this.stopMarkers = new StopMarkerManager(this.map)
    this.discoveryTracker = new DiscoveryTracker(this.map)
    this.trackingTracker = new TrackingTracker(this.map)

    L.control.scale({ imperial: false, maxWidth: 300 }).addTo(this.map)
  }

  start() {
    this.tileManager.start()
    this.stopMarkers.start()
    this.discoveryTracker.start()
    this.trackingTracker.start()
    this.startGpsEffect()
    this.startReviveEffect()
  }

  recenter() {
    const loc = gpsSignal.value
    if (!loc) return
    this.map.flyTo({ lat: loc.latitude, lng: loc.longitude })
  }

  flyToStop(id: number) {
    this.stopMarkers.flyTo(id)
  }

  flyToFeeder(lat: number, lon: number) {
    this.map.flyTo({ lat, lng: lon })
  }

  private startGpsEffect() {
    let hasFlown = false

    effect(() => {
      const loc = gpsSignal.value
      if (loc === null) return

      connection.updatePosition(loc)

      const { latitude, longitude } = loc

      if (this.myMarker === null) {
        this.myMarker = L.marker([latitude, longitude])
          .setIcon(MY_MARKER_ICON)
          .addTo(this.map)
      }

      this.myMarker.setLatLng({ lat: latitude, lng: longitude })

      if (!hasFlown) {
        hasFlown = true
        this.map.zoomIn(5).flyTo({ lat: latitude, lng: longitude })
      }

      isReady().then(() => {
        getClosestStops(loc).then(res => {
          closestStops.value = res
        })
      })
    })
  }

  private startReviveEffect() {
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
  }
}

let manager: MapManager | null = null

export function renderMap() {
  manager = new MapManager()
  manager.start()
  return { map: manager.map }
}

export function recenterMap() {
  manager?.recenter()
}

export function flyToStop(id: number) {
  manager?.flyToStop(id)
}

export function flyToFeeder(lat: number, lon: number) {
  manager?.flyToFeeder(lat, lon)
}
