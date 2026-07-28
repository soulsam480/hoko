import { effect } from '@preact/signals'
import * as L from 'leaflet'
import { theme, type TTheme } from '../stores'

const TILE_URLS: Record<TTheme, string> = {
  dracula: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  lemonade: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
}

export class TileManager {
  private tileLayer: L.TileLayer

  constructor(private map: L.Map) {
    const currentTheme = theme.value
    this.tileLayer = L.tileLayer(TILE_URLS[currentTheme], {
      crossOrigin: true,
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map)
    document.documentElement.setAttribute('data-theme', currentTheme)
  }

  start() {
    effect(() => {
      const currentTheme = theme.value
      this.map.removeLayer(this.tileLayer)
      this.tileLayer = L.tileLayer(TILE_URLS[currentTheme], {
        crossOrigin: true,
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map)
      document.documentElement.setAttribute('data-theme', currentTheme)
    })
  }
}
