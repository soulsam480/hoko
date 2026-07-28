import { signal } from '@preact/signals'
import { Route, Stop } from '../db/schema'
import { persistedSignal } from './persisted-signal'

export interface Feeder {
  userId: string
  lat: number
  lon: number
  lastSeen: number
}

export interface FeederPresence {
  userId: string
  routeId: number
  lat: number
  lon: number
  lastSeen: number
}

export const gpsSignal = signal<GeolocationCoordinates | null>(null)

export const closestStops = signal<Stop[]>([])
export const chosenStop = persistedSignal<Stop | null>(null, 'chosen-stop')
export const chosenRoute = persistedSignal<Route | null>(null, 'chosen-route')

export const insideBus = persistedSignal(false, 'is-inside-bus')

export const feeders = signal<Feeder[]>([])
export const presenceIndex = signal<Map<number, FeederPresence[]>>(new Map())
export const connectionState = signal<'idle' | 'joining' | 'joined' | 'error'>(
  'idle'
)

export const isInitializingDatabase = signal(true)

export type TTheme = 'dracula' | 'lemonade'

export const theme = persistedSignal<TTheme>('dracula', 'theme')
