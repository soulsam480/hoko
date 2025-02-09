import 'leaflet/dist/leaflet.css'
import './index.css'
import { isReady } from './db/browser'
import { isInitializingDatabase } from './ui/stores'
import { render } from 'preact'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'
import { renderMap } from './ui/geo/map'
import { startGPS } from './ui/geo/pos'

isReady().then(async () => {
  isInitializingDatabase.value = true
})

const { map } = renderMap()

startGPS(map)

render(<App />, document.getElementById('hoko-controls')!)

registerSW({ immediate: true })
