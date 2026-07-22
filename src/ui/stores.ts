import { signal } from '@preact/signals'
import { persistedSignal } from './persisted-signal'
import { Route, Stop } from '../db/schema'

export const gpsSignal = signal<GeolocationCoordinates | null>(null)

export const closestStops = signal<Stop[]>([])
export const chosenStop = persistedSignal<Stop | null>(null, 'chosen-stop')
export const chosenRoute = persistedSignal<Route | null>(null, 'chosen-route')

export const insideBus = persistedSignal(false, 'is-inside-bus')

export const isInitializingDatabase = signal(true)
