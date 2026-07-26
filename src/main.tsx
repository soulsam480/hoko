import 'leaflet/dist/leaflet.css'
import './index.css'
import { render } from 'preact'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'
import { renderMap } from './ui/geo/map'
import { startGPS } from './ui/geo/pos'

renderMap()

startGPS()

render(<App />, document.getElementById('hoko-controls')!)

registerSW({ immediate: true })
