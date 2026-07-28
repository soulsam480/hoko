import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { isReady } from '../../db/client'
import { getRoutesForStop } from '../../db/queries'
import { chosenStop, closestStops, drawerOpen, stopRoutes } from '../stores'
import { STOP_ICON } from './map-icons'

export class StopMarkerManager {
  private markers = new Map<number, L.Marker>()
  private lastHighlight: L.Marker | null = null

  constructor(private map: L.Map) {}

  flyTo(id: number) {
    const marker = this.markers.get(id)
    if (!marker) return
    this.map.flyTo(marker.getLatLng())
  }

  start() {
    this.startClosestStopsEffect()
    this.startHighlightEffect()
  }

  private startClosestStopsEffect() {
    effect(() => {
      const stops = closestStops.value

      for (const [id, marker] of this.markers) {
        if (!stops.find(s => s.id === id)) {
          marker.remove()
          this.markers.delete(id)
        }
      }

      for (const stop of stops) {
        let marker = this.markers.get(stop.id)

        if (!marker) {
          marker = L.marker([stop.lat, stop.lon], {
            icon: STOP_ICON
          }).addTo(this.map)

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

          this.markers.set(stop.id, marker)
        }

        marker.setLatLng([stop.lat, stop.lon])
      }
    })
  }

  private startHighlightEffect() {
    const clearLastHighlight = () => {
      if (this.lastHighlight) {
        this.lastHighlight.getElement()?.removeAttribute('data-active')
        this.lastHighlight = null
      }
    }

    effect(() => {
      const stop = chosenStop.value

      if (!stop) {
        clearLastHighlight()
        return
      }

      const activeMarker = this.markers.get(stop.id)

      if (!activeMarker) {
        clearLastHighlight()
        return
      }

      this.lastHighlight?.getElement()?.removeAttribute('data-active')
      activeMarker.getElement()?.setAttribute('data-active', 'true')
      this.lastHighlight = activeMarker
    })
  }
}
