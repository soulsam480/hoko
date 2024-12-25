import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import { WSContext, WSMessageReceive } from 'hono/ws'

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()

const socketMap = new Map<string, WSContext<ServerWebSocket>>()
const consumers = new Map<string, IConsumer>()

function serializeMessage(
  message: MessageEvent<WSMessageReceive>
): IConnectionRequest | IInsideBusRequest | ITrackingRequest | IPingRequest {
  return JSON.parse(message.data.toString())
}

function packMessage(
  message: IConnectionReponse | ITrackingResponse | ITrackingPingResponse
) {
  return JSON.stringify(message)
}

function findFeeders(consumer: IConsumer): IConsumer[] {
  const result: IConsumer[] = []

  consumers.forEach(item => {
    if (
      item.stop_id === consumer.stop_id &&
      item.route_id === consumer.route_id &&
      item.inside_bus &&
      item.id !== consumer.id
    ) {
      result.push(item)
    }
  })

  return result
}

const app = new Hono()

interface IConsumer {
  id: string
  inside_bus: boolean
  route_id: string
  stop_id: number
  coordinates?: [lat: number, lng: number]
  subscribers: string[]
}

interface IConsumableFeeder {
  id: string
  coordinates: [lat: number, lng: number]
}

interface ITrackingResponse {
  type: 'tracking_suc'
  feeder_id: string
  route_id: string
  stop_id: number
  coordinates: [lat: number, lng: number]
}

interface IConnectionReponse {
  type: 'connection_suc'
  route_id: string
  stop_id: number
  // TODO: think if we need id for consumers
  feeders: Array<IConsumableFeeder>
}

interface IConnectionRequest {
  type: 'connection'
  id: string
  route_id: string
  stop_id: number
  inside_bus: boolean
}

interface IInsideBusRequest {
  type: 'inside_bus'
  id: string
  inside_bus: boolean
}

interface ITrackingRequest {
  type: 'tracking'
  id: string
  feeder_id: string
  route_id: string
  stop_id: number
}

interface IPingRequest {
  type: 'ping'
  id: string
  coordinates: [lat: number, lng: number]
}

interface ITrackingPingResponse {
  type: 'pong'
  id: string
  feeder_id: string
  coordinates: [lat: number, lng: number]
}

function registerConsumer(
  ws: WSContext<ServerWebSocket>,
  data: IConnectionRequest
) {
  try {
    if (data.id === undefined || socketMap.has(data.id)) {
      ws.send(JSON.stringify({ ev: 'c_err' }))

      return
    }

    const consumer: IConsumer = {
      id: data.id,
      inside_bus: data.inside_bus,
      route_id: data.route_id,
      stop_id: data.stop_id,
      subscribers: []
    }

    socketMap.set(data.id, ws)
    consumers.set(data.id, consumer)

    const feeders = findFeeders(consumer)

    ws.send(
      packMessage({
        type: 'connection_suc',
        feeders: feeders.map(it => ({
          id: it.id,
          coordinates: it.coordinates as NonNullable<IConsumer['coordinates']>
        })),
        route_id: consumer.route_id,
        stop_id: consumer.stop_id
      })
    )
  } catch (error) {
    ws.send(JSON.stringify({ ev: 'c_err' }))
  }
}

function updateInsideBus(
  ws: WSContext<ServerWebSocket>,
  data: IInsideBusRequest
) {
  const consumer = consumers.get(data.id)

  if (consumer === undefined) {
    return
  }

  consumer.inside_bus = data.inside_bus

  consumers.set(data.id, consumer)
}

function trackFeeder(ws: WSContext<ServerWebSocket>, data: ITrackingRequest) {
  const feeder = consumers.get(data.feeder_id)

  if (feeder === undefined) {
    // TODO: handle error
    return
  }

  feeder.subscribers.push(data.id)

  consumers.set(data.feeder_id, feeder)

  ws.send(
    packMessage({
      type: 'tracking_suc',
      coordinates: feeder.coordinates as NonNullable<IConsumer['coordinates']>,
      feeder_id: data.feeder_id,
      route_id: data.route_id,
      stop_id: data.stop_id
    })
  )
}

function updatePingAndBroadcast(
  ws: WSContext<ServerWebSocket>,
  data: IPingRequest
) {
  const feeder = consumers.get(data.id)

  if (feeder === undefined) {
    //TODO: handle errors
    return
  }

  feeder.coordinates = data.coordinates

  feeder.subscribers.forEach(sub => {
    const socket = socketMap.get(sub)

    if (socket === undefined) {
      return
    }

    socket.send(
      packMessage({
        type: 'pong',
        coordinates: feeder.coordinates as NonNullable<
          IConsumer['coordinates']
        >,
        feeder_id: feeder.id,
        id: sub
      })
    )
  })
}

app
  .get('/api/health', c => {
    return c.text('OK')
  })
  .get(
    '/api/ws',
    upgradeWebSocket(() => {
      return {
        onMessage(event, ws) {
          const data = serializeMessage(event)

          switch (data.type) {
            case 'connection':
              registerConsumer(ws, data)
              break

            case 'tracking':
              trackFeeder(ws, data)
              break

            case 'inside_bus':
              updateInsideBus(ws, data)
              break

            case 'ping':
              updatePingAndBroadcast(ws, data)
          }

          ws.send('Hello from server!')
        },
        onClose: () => {
          console.log('Connection closed')
        }
      }
    })
  )

export default {
  fetch: app.fetch,
  websocket
}
