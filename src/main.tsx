import 'leaflet/dist/leaflet.css'
import './index.css'
import { isReady } from './db/browser'
import { isInitializingDatabase } from './ui/stores'
import { render } from 'preact'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'
import { startGPS } from './geo/pos'
import { renderMap } from './geo/map'

isReady().then(async () => {
  isInitializingDatabase.value = true
})

const { map } = renderMap()

startGPS(map)

render(<App />, document.getElementById('hoko-controls')!)

registerSW({ immediate: true })
