import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { clusterFeeders } from '../../lib/coordinates'
import { connection } from '../connection'
import {
  chosenRoute,
  drawerOpen,
  type FeederPresence,
  mapMode,
  presenceIndex,
  stopRoutes
} from '../stores'
import { USER_ID } from '../userId'
import { clusterPresenceIcon, PRESENCE_ICON } from './map-icons'

export class DiscoveryTracker {
  private markers = new Map<string, L.Marker>()

  constructor(private map: L.Map) {}

  start() {
    effect(() => {
      const mode = mapMode.value
      const routes = stopRoutes.value

      if (mode !== 'discovery' || routes.length === 0) {
        for (const [, marker] of this.markers) {
          marker.remove()
        }
        this.markers.clear()
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

      for (const [key, marker] of this.markers) {
        if (!clusterKeys.has(key)) {
          marker.remove()
          this.markers.delete(key)
        }
      }

      for (const cluster of clusters) {
        const key = `${cluster.routeId}:${cluster.ids.join(',')}`
        let marker = this.markers.get(key)

        if (cluster.count > 1) {
          if (!marker) {
            marker = L.marker(cluster.center, {
              icon: clusterPresenceIcon(cluster.count)
            }).addTo(this.map)
            marker.bindTooltip(`${cluster.count} buses`, { direction: 'top' })
            this.markers.set(key, marker)
          }
          marker.setLatLng(cluster.center)
        } else {
          if (!marker) {
            marker = L.marker(cluster.center, { icon: PRESENCE_ICON }).addTo(
              this.map
            )
            marker.bindTooltip('', { direction: 'top' })
            this.markers.set(key, marker)
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
  }
}
