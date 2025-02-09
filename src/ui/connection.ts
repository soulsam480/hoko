import Sockette from 'sockette'
import {
  IConnectionRequest,
  IConnectionResponse,
  IConsumableFeeder,
  IConsumerDisconnectedResponse,
  IErrorResponse,
  IFindFeedersRequest,
  IFindFeedersResponse,
  IInsideBusRequest,
  ISubscriberPongResponse,
  ITrackingDisconnectionRequest,
  ITrackingRequest,
  ITrackingResponse
} from '../messages'
import { chosenRoute, chosenStop, gpsSignal, insideBus } from './stores'
import { USER_ID } from './userId'
import { computed, signal } from '@preact/signals'
import { updatePartial } from './store-utils'

interface ITrackingState {
  state: 'requested' | 'tracking' | 'idle'
  feeder_id: string | null
  feeder_coords: [lat: number, lng: number] | null
  started_at: Date | null
  stop_id: number | null
  route_id: string | null
}

interface IConnectionState {
  feeders: IConsumableFeeder[]
  state: 'connecting' | 'connected' | 'offline'
}

class Connection {
  static defaultTrackingState(): ITrackingState {
    return {
      state: 'idle',
      feeder_id: null,
      feeder_coords: null,
      started_at: null,
      stop_id: null,
      route_id: null
    }
  }

  static unpack(
    data: any
  ):
    | IConnectionResponse
    | ITrackingResponse
    | IErrorResponse
    | ISubscriberPongResponse
    | IConsumerDisconnectedResponse
    | IFindFeedersResponse
    | null {
    try {
      return JSON.parse(data)
    } catch (error) {
      return null
    }
  }

  readonly ws: Sockette
  readonly trackingState = signal<ITrackingState>(
    Connection.defaultTrackingState()
  )

  readonly connectionState = signal<IConnectionState>({
    feeders: [],
    state: 'offline'
  })

  get feeders() {
    return computed(() => this.connectionState.value.feeders)
  }

  constructor() {
    this.ws = new Sockette(import.meta.env.VITE_PUBLIC_WS_URL + '/api/ws', {
      timeout: 5e3,
      maxAttempts: 10,
      onopen: this.connect.bind(this),
      onmessage: ev => {
        const data = Connection.unpack(ev.data)

        if (data === null) return

        switch (data.type) {
          case 'c_s':
            this.onConnectionSuccess(data)
            break

          case 't_s':
            this.onTrackingSuccess(data)
            break

          case 't_po':
            this.onTrackingPongSuccess(data)
            break

          case 'dis':
            this.onFeederDisconnected(data)
            break

          case 'f_s':
            this.onFindFeedersSuccess(data)
            break

          case 'err':
            console.error('[HOKO Error]: ', data.message)
            break

          default:
            console.log('[HOKO]: unknown event', data)
        }
      },
      onreconnect: e => {
        console.log('Reconnecting...', e)

        updatePartial(this.connectionState)({
          state: 'connecting'
        })
      },
      onmaximum: e => console.log('Stop Attempting!', e),
      onclose: () => {
        console.log('Closed!')

        updatePartial(this.connectionState)({
          state: 'offline'
        })
      },
      onerror: e => {
        console.log('[HOKO Error]: ', e)

        updatePartial(this.connectionState)({
          state: 'offline'
        })
      }
    })

    // NOTE: ping location on every gps signal change
    gpsSignal.subscribe(pos => {
      if (pos === null || this.state() !== 'connected') {
        return
      }

      this.pingLocation([pos.latitude, pos.longitude])
    })
  }

  state() {
    return this.connectionState.peek().state
  }

  // TODO: we need to build restore tracking when reconnection happens
  private connect() {
    if (gpsSignal.value === null || this.state() === 'connected') return

    const { latitude, longitude } = gpsSignal.value

    const connPayload: IConnectionRequest = {
      coordinates: [latitude, longitude],
      id: USER_ID,
      inside_bus: insideBus.value,
      route_id: chosenRoute.peek(),
      stop_id: chosenStop.peek()?.id || null,
      type: 'c',
      feeder_id: null
    }

    this.ws.json(connPayload)

    updatePartial(this.connectionState)({
      state: 'connecting'
    })
  }

  private onConnectionSuccess(e: IConnectionResponse) {
    this.connectionState.value = {
      feeders: e.feeders,
      state: 'connected'
    }
  }

  track(feederId: string) {
    const { stop_id, route_id } = this.trackingState.peek()

    if (stop_id === null || route_id === null) {
      return
    }

    updatePartial(this.trackingState)({
      state: 'requested',
      feeder_id: feederId
    })

    const payload: ITrackingRequest = {
      type: 't',
      feeder_id: feederId,
      route_id,
      stop_id,
      id: USER_ID
    }

    this.ws.json(payload)
  }

  private onTrackingSuccess(e: ITrackingResponse) {
    updatePartial(this.trackingState)({
      feeder_coords: e.coordinates,
      state: 'tracking',
      started_at: new Date()
    })
  }

  untrack() {
    if (this.trackingState.peek().feeder_id) {
      this.ws.json({
        type: 't_dis',
        feeder_id: this.trackingState.peek().feeder_id!,
        id: USER_ID
      } satisfies ITrackingDisconnectionRequest)
    }

    updatePartial(this.trackingState)({
      state: 'idle',
      feeder_id: null,
      started_at: null,
      feeder_coords: null
    })
  }

  pingLocation(loc: [lat: number, lng: number]) {
    this.ws.json({
      type: 't_pi',
      coordinates: loc,
      id: USER_ID
    })
  }

  private onTrackingPongSuccess(e: ISubscriberPongResponse) {
    updatePartial(this.trackingState)({
      feeder_coords: e.coordinates
    })
  }

  private onFeederDisconnected(e: IConsumerDisconnectedResponse) {
    const { feeder_id } = this.trackingState.peek()

    if (feeder_id === e.feeder_id) {
      // TODO: notification
      this.trackingState.value = Connection.defaultTrackingState()
    }

    updatePartial(this.connectionState)({
      feeders: this.connectionState.value.feeders.filter(
        it => it.id !== e.feeder_id
      )
    })
  }

  findFeeders(stop_id: number, route_id: string) {
    updatePartial(this.trackingState)({
      route_id,
      stop_id
    })

    this.ws.json({
      id: USER_ID,
      route_id,
      stop_id,
      type: 'f'
    } satisfies IFindFeedersRequest)
  }

  private onFindFeedersSuccess(e: IFindFeedersResponse) {
    updatePartial(this.connectionState)({
      feeders: e.feeders
    })
  }

  updateInsideBus(status: boolean) {
    this.ws.json({
      id: USER_ID,
      inside_bus: status,
      type: 'i_b'
    } satisfies IInsideBusRequest)

    // NOTE: as the user is inside bus, we can keep the tracking their feeder but we can ignore the pongs received
    // i.e. we don't need to update the feeder position
  }

  resetFeeders() {
    updatePartial(this.connectionState)({
      feeders: []
    })
  }
}

export const connection = new Connection()
