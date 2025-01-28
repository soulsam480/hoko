import { ServerWebSocket } from 'bun'
import { WSContext } from 'hono/ws'
import mitt from 'mitt'
import {
  IConnectionResponse,
  ITrackingResponse,
  ISubscriberPongResponse,
  IConsumerDisconnectedResponse,
  IErrorResponse,
  IConnectionRequest,
  IConsumer
} from '../../messages'
import { packMessage } from './transport'
import { globalBus } from './bus'

export class ClientError extends Error {
  constructor(
    private readonly ws: WSContext<ServerWebSocket>,
    private readonly error: IErrorResponse
  ) {
    super('Client error')
  }

  send() {
    this.ws.send(packMessage(this.error))
  }
}

export const clients = new Map<string, Client>()

type ClientEvents = {
  'update:tracking': [lat: number, lng: number]
}

export class Client {
  static create(ws: WSContext<ServerWebSocket>, req: IConnectionRequest) {
    const client = new Client(req.id, ws, req.inside_bus, req.coordinates)

    clients.set(req.id, client)
    return client
  }

  static find(id: string, ws: WSContext<ServerWebSocket>) {
    const feeder = clients.get(id)

    if (feeder === undefined) {
      throw new ClientError(ws, {
        type: 'err',
        message: 'bad_req'
      })
    }

    return feeder
  }

  static track(id: string, client: Client) {
    const feeder = Client.find(id, client.ws)

    feeder.subscribe(client)
  }

  static untrack(id: string, client: Client) {
    const feeder = Client.find(id, client.ws)
    feeder.unsubscribe(client)
  }

  static findTrackableFeeders(client: Client): Client[] {
    const result: Client[] = []

    clients.forEach(item => {
      if (item.isTrackable(client)) {
        result.push(item)
      }
    })

    return result
  }

  readonly subs = new Set<Client>()

  #bus = mitt<ClientEvents>()

  inside_bus: boolean
  coordinates: [lat: number, lng: number]
  route_id: string | null = null
  stop_id: string | null = null

  constructor(
    readonly id: string,
    readonly ws: WSContext<ServerWebSocket>,
    inside_bus: boolean,
    coordinates: [lat: number, lng: number]
  ) {
    this.inside_bus = inside_bus
    this.coordinates = coordinates

    // globalBus.on('update:registry', this.sendUpdateRegistry.bind(this))
  }

  isTrackable(sub: Client) {
    return (
      this.inside_bus &&
      this.route_id === sub.route_id &&
      !this.subs.has(sub) &&
      !sub.subs.has(this)
    )
  }

  setInsideBus(inside_bus: boolean) {
    this.inside_bus = inside_bus

    globalBus.emit('update:registry', this)
  }

  setCoordinates(coordinates: [lat: number, lng: number]) {
    this.coordinates = coordinates

    this.#bus.emit('update:tracking', this.coordinates)
    globalBus.emit('update:registry', this)
  }

  setParams(stop_id: string, route_id: string) {
    this.stop_id = stop_id
    this.route_id = route_id
  }

  subscribe(client: Client) {
    this.subs.add(client)

    const handler = (pos: [lat: number, lng: number]) => {
      if (!this.subs.has(client)) {
        this.#bus.off('update:tracking', handler)

        return
      }

      client.sendTrackingPong(this, pos)
    }

    this.#bus.on('update:tracking', handler)

    client.sendSubscriptionSuccess(this, this.coordinates)
  }

  unsubscribe(client: Client) {
    this.subs.delete(client)
  }

  removeSelf() {
    this.subs.values().forEach(sub => {
      sub.sendDisconnection(this)
    })

    clients.delete(this.id)
  }

  // NOTE: messages ------------------------------

  private send(
    message:
      | IConnectionResponse
      | ITrackingResponse
      | ISubscriberPongResponse
      | IConsumerDisconnectedResponse
      | IErrorResponse
  ) {
    if (this.ws.readyState === 3) {
      return
    }

    this.ws.send(packMessage(message))
  }

  sendConnectionSuccess() {
    this.send({
      type: 'c_s',
      id: this.id,
      feeders: Client.findTrackableFeeders(this).map(it => ({
        id: it.id,
        coordinates: it.coordinates as NonNullable<IConsumer['coordinates']>
      }))
    })
  }

  sendSubscriptionSuccess(feeder: Client, pos: IConsumer['coordinates']) {
    this.send({
      coordinates: pos,
      id: this.id,
      feeder_id: feeder.id,
      type: 't_s'
    } satisfies ITrackingResponse)
  }

  sendTrackingPong(feeder: Client, pos: IConsumer['coordinates']) {
    this.send({
      type: 't_po',
      coordinates: pos,
      feeder_id: feeder.id,
      id: this.id
    } satisfies ISubscriberPongResponse)
  }

  sendDisconnection(feeder: Client) {
    this.send({
      type: 'dis',
      feeder_id: feeder.id,
      id: this.id
    })
  }
}
