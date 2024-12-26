import Sockette from 'sockette'
import {
  IConnectionRequest,
  IConnectionResponse,
  IConsumerDisconnectedResponse,
  IErrorResponse,
  IFeederPingRequest,
  IInsideBusRequest,
  ISubscriberPongResponse,
  ITrackingRequest,
  ITrackingResponse
} from './messages'
import { gpsSignal, insideBus, trackingMeta } from './ui/stores'
import { USER_ID } from './ui/userId'
import { effect } from '@preact/signals'

let conn: Sockette | null = null

function serializeResponse(
  data: any
):
  | IConnectionResponse
  | ITrackingResponse
  | IErrorResponse
  | ISubscriberPongResponse
  | IConsumerDisconnectedResponse
  | null {
  try {
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}

export function register(
  stopId: number,
  routeId: string,
  feederId: string | null = null
) {
  if (conn !== null) {
    conn.close()
    conn = null
  }

  conn = new Sockette(import.meta.env.VITE_PUBLIC_WS_URL + '/api/ws', {
    timeout: 5e3,
    maxAttempts: 10,
    onopen() {
      if (gpsSignal.value === null) return
      const { latitude, longitude } = gpsSignal.value

      const connPayload: IConnectionRequest = {
        coordinates: [latitude, longitude],
        id: USER_ID,
        inside_bus: insideBus.value,
        route_id: routeId,
        stop_id: stopId,
        type: 'c',
        feeder_id: feederId
      }

      conn?.json(connPayload)
    },
    onmessage(ev) {
      const data = serializeResponse(ev.data)

      if (data === null) return

      switch (data.type) {
        case 'c_s':
          trackingMeta.value = {
            feeder_id: null,
            feeder_coords: null,
            route_id: data.route_id,
            stop_id: data.stop_id,
            started: new Date().toISOString(),
            feeders: data.feeders
          }
          break

        case 't_s':
          {
            if (trackingMeta.value === null) return

            trackingMeta.value = {
              ...trackingMeta.value,
              feeder_id: data.feeder_id,
              feeder_coords: data.coordinates,
              route_id: data.route_id,
              stop_id: data.stop_id
            }
          }

          break

        case 't_po':
          {
            if (trackingMeta.value === null) {
              return
            }

            trackingMeta.value = {
              ...trackingMeta.value,
              feeder_id: data.feeder_id,
              feeder_coords: data.coordinates
            }
          }

          break

        case 'dis':
          {
            if (trackingMeta.value === null) {
              return
            }

            if (trackingMeta.value.feeder_id === data.feeder_id) {
              trackingMeta.value = {
                ...trackingMeta.value,
                feeder_id: null,
                feeder_coords: null
              }
            }

            trackingMeta.value.feeders = trackingMeta.value.feeders.filter(
              it => it.id !== data.feeder_id
            )
          }
          break

        case 'err':
          console.error('[HOKO Error]: ', data.message)
          break

        default:
          console.log('[HOKO]: unknown event', data)
      }
    },
    onreconnect: e => console.log('Reconnecting...', e),
    onmaximum: e => console.log('Stop Attempting!', e),
    onclose() {
      console.log('Closed!')

      trackingMeta.value = null
    },
    onerror: e => console.log('[HOKO Error]: ', e)
  })
}

export function restoreTracking() {
  if (trackingMeta.value !== null) {
    register(
      trackingMeta.value.stop_id,
      trackingMeta.value.route_id,
      trackingMeta.value.feeder_id
    )
  }
}

export function trackFeeder(feederId: string) {
  const meta = trackingMeta.value
  if (meta === null) {
    return
  }

  conn?.json({
    type: 't',
    feeder_id: feederId,
    route_id: meta.route_id,
    stop_id: meta.stop_id,
    id: USER_ID
  } satisfies ITrackingRequest)
}

export function updateInside(inside: boolean) {
  const meta = trackingMeta.value
  if (meta === null) {
    return
  }

  conn?.json({
    id: USER_ID,
    inside_bus: inside,
    type: 'i_b'
  } satisfies IInsideBusRequest)
}

effect(() => {
  if (gpsSignal.value === null) {
    return
  }

  // restoreTracking()

  const { latitude, longitude } = gpsSignal.value

  conn?.json({
    type: 't_pi',
    coordinates: [latitude, longitude],
    id: USER_ID
  } satisfies IFeederPingRequest)
})
