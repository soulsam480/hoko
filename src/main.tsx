import 'leaflet/dist/leaflet.css'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { render } from 'preact'
import { App } from './App'
import { renderMap } from './ui/geo/map'
import { startGPS } from './ui/geo/pos'

renderMap()

startGPS()

render(<App />, document.getElementById('hoko-controls')!)

registerSW({ immediate: true })
