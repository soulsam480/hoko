import 'leaflet/dist/leaflet.css'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { render } from 'preact'
import { App } from './App'
import { connection } from './ui/connection'
import { renderMap } from './ui/geo/map'
import { startGPS } from './ui/geo/pos'

renderMap()

startGPS()

connection.init()

render(<App />, document.getElementById('hoko-controls')!)

registerSW({ immediate: true })
