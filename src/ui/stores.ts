import { computed, signal } from '@preact/signals'
import { TBusStop } from '../db/schema'
import { persistedSignal } from './persisted-signal'
import { IConsumableFeeder } from '../messages'

export interface TrackingMeta {
  feeder_id: string | null
  started: string
  stop_id: number
  route_id: string
  feeders: IConsumableFeeder[]
  feeder_coords: [lat: number, lng: number] | null
}

export const gpsSignal = signal<GeolocationCoordinates | null>(null)

export const closestStops = signal<TBusStop[]>([])
export const chosenStop = persistedSignal<TBusStop | null>(null, 'chosen-stop')
export const chosenRoute = persistedSignal<string | null>(null, 'chosen-route')

export const trackingMeta = persistedSignal<TrackingMeta | null>(
  null,
  'tracking-meta'
)

export const isTrackingFeeder = computed(() => trackingMeta.value !== null)

export const insideBus = persistedSignal(false, 'is-inside-bus')

export const isInitializingDatabase = signal(false)
