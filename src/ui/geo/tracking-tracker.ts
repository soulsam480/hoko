import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { clusterFeeders } from '../../lib/coordinates'
import { chosenRoute, type FeederPresence, feeders, mapMode } from '../stores'
import { clusterBusIcon, BUS_ICON } from './map-icons'

export class TrackingTracker {
  private markers = new Map<string, L.Marker>()

  constructor(private map: L.Map) {}

  start() {
    effect(() => {
      const mode = mapMode.value
      const currentFeeders = feeders.value

      if (mode !== 'tracking' || currentFeeders.length === 0) {
        for (const [, marker] of this.markers) {
          marker.remove()
        }
        this.markers.clear()
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
              icon: clusterBusIcon(cluster.count)
            }).addTo(this.map)
            marker.bindTooltip(`${cluster.count} buses`, { direction: 'top' })
            this.markers.set(key, marker)
          }
          marker.setLatLng(cluster.center)
        } else {
          if (!marker) {
            marker = L.marker(cluster.center, { icon: BUS_ICON }).addTo(
              this.map
            )
            marker.bindTooltip('', { direction: 'top' })
            this.markers.set(key, marker)
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
  }
}
