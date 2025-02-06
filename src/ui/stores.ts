import { signal } from '@preact/signals'
import { TBusStop } from '../db/schema'
import { persistedSignal } from './persisted-signal'

export const gpsSignal = signal<GeolocationCoordinates | null>(null)

export const closestStops = signal<TBusStop[]>([])
export const chosenStop = persistedSignal<TBusStop | null>(null, 'chosen-stop')
export const chosenRoute = persistedSignal<string | null>(null, 'chosen-route')

export const insideBus = persistedSignal(false, 'is-inside-bus')

export const isInitializingDatabase = signal(false)
