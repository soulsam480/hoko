import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import { WSContext, WSMessageReceive } from 'hono/ws'
import {
  IConsumer,
  IConnectionRequest,
  IInsideBusRequest,
  ITrackingRequest,
  IFeederPingRequest,
  IConnectionResponse,
  ITrackingResponse,
  ISubscriberPongResponse,
  IConsumerDisconnectedResponse,
  IErrorResponse,
  ITrackingDisconnectionRequest
} from './messages'

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()

// TODO: try using ip for tracking ?

const socketMap = new Map<string, WSContext<ServerWebSocket>>()
const consumers = new Map<string, IConsumer>()

// NOTE: ------------------ utils ----------------

function serializeMessage(
  message: MessageEvent<WSMessageReceive>
):
  | IConnectionRequest
  | IInsideBusRequest
  | ITrackingRequest
  | IFeederPingRequest
  | ITrackingDisconnectionRequest {
  const data = JSON.parse(message.data.toString())

  if (!('type' in data)) {
    throw new Error('Bad request')
  }

  return data
}

function packMessage(
  message:
    | IConnectionResponse
    | ITrackingResponse
    | ISubscriberPongResponse
    | IConsumerDisconnectedResponse
    | IErrorResponse
) {
  return JSON.stringify(message)
}

function findTrackableFeeders(consumer: IConsumer): IConsumer[] {
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

function notifySubscribers(
  feeder: IConsumer,
  iter: (sub: string) => Parameters<typeof packMessage>[0]
) {
  feeder.subscribers.forEach(sub => {
    const socket = socketMap.get(sub)

    if (socket === undefined) {
      return
    }

    socket.send(packMessage(iter(sub)))
  })
}

// NOTE: ------------------ Handlers ----------------

function registerConsumer(
  ws: WSContext<ServerWebSocket>,
  data: IConnectionRequest
) {
  try {
    if (data.id === undefined || socketMap.has(data.id)) {
      ws.send(
        packMessage({
          type: 'err',
          message: 'bad_req'
        })
      )

      return
    }

    const consumer: IConsumer = {
      id: data.id,
      inside_bus: data.inside_bus,
      route_id: data.route_id,
      stop_id: data.stop_id,
      subscribers: new Set(),
      coordinates: data.coordinates
    }

    socketMap.set(data.id, ws)
    consumers.set(data.id, consumer)

    const feeders = findTrackableFeeders(consumer)

    ws.send(
      packMessage({
        type: 'c_s',
        id: consumer.id,
        feeders: feeders.map(it => ({
          id: it.id,
          coordinates: it.coordinates as NonNullable<IConsumer['coordinates']>
        })),
        route_id: consumer.route_id,
        stop_id: consumer.stop_id
      })
    )

    if (data.feeder_id) {
      trackFeeder(ws, {
        feeder_id: data.feeder_id,
        id: data.id,
        route_id: data.route_id,
        stop_id: data.stop_id,
        type: 't'
      })
    }

    console.log('[HOKO]: ', data.id, ' connected!')
  } catch (error) {
    ws.send(packMessage({ type: 'err', message: 'no_reg' }))
  }
}

function updateInsideBus(
  ws: WSContext<ServerWebSocket>,
  data: IInsideBusRequest
) {
  const consumer = consumers.get(data.id)

  if (consumer === undefined) {
    ws.send(
      packMessage({
        type: 'err',
        message: 'bad_req'
      })
    )
    return
  }

  consumer.inside_bus = data.inside_bus

  consumers.set(data.id, consumer)
}

function trackFeeder(ws: WSContext<ServerWebSocket>, data: ITrackingRequest) {
  const feeder = consumers.get(data.feeder_id)
  const sub = consumers.get(data.id)

  if (
    feeder === undefined ||
    sub === undefined ||
    // already subscribed
    feeder.subscribers.has(data.id) ||
    // feeder is subscriber of sub
    sub.subscribers.has(data.feeder_id)
  ) {
    ws.send(
      packMessage({
        type: 'err',
        message: 'bad_req'
      })
    )
    return
  }

  feeder.subscribers.add(data.id)

  consumers.set(data.feeder_id, feeder)

  ws.send(
    packMessage({
      type: 't_s',
      id: data.id,
      coordinates: feeder.coordinates as NonNullable<IConsumer['coordinates']>,
      feeder_id: data.feeder_id,
      route_id: data.route_id,
      stop_id: data.stop_id
    })
  )
}

function updatePingAndBroadcast(
  ws: WSContext<ServerWebSocket>,
  data: IFeederPingRequest
) {
  const feeder = consumers.get(data.id)

  if (feeder === undefined || !feeder.inside_bus) {
    ws.send(
      packMessage({
        type: 'err',
        message: 'bad_req'
      })
    )
    return
  }

  feeder.coordinates = data.coordinates

  consumers.set(feeder.id, feeder)

  notifySubscribers(feeder, sub => {
    return {
      type: 't_po',
      coordinates: feeder.coordinates as NonNullable<IConsumer['coordinates']>,
      feeder_id: feeder.id,
      id: sub
    }
  })
}

function removeConsumer(id: string) {
  const consumer = consumers.get(id)

  if (consumer === undefined) return

  consumers.delete(id)
  socketMap.delete(id)

  consumers.values().forEach(con => {
    if (con.subscribers.has(id)) {
      con.subscribers.delete(id)
      consumers.set(con.id, con)
    }
  })

  notifySubscribers(consumer, sub => {
    return {
      type: 'dis',
      feeder_id: consumer.id,
      id: sub
    }
  })
}

function cleanupStaleSockets() {
  for (const socket of socketMap.entries()) {
    if (socket[1].readyState === 3) {
      removeConsumer(socket[0])
    }
  }
}

function disconnectTracking(
  ws: WSContext<ServerWebSocket>,
  data: ITrackingDisconnectionRequest
) {
  const feeder = consumers.get(data.feeder_id)

  if (feeder === undefined) {
    ws.send(
      packMessage({
        type: 'err',
        message: 'bad_req'
      })
    )

    return
  }

  feeder.subscribers.delete(data.id)
  consumers.set(feeder.id, feeder)
}

const app = new Hono()

// TODO: 1. cors
// 2. add check for token some sort of
// 3. don't allow further conn with no regis

app
  .get('/api/health', c => {
    return c.text('OK')
  })
  .get(
    '/api/ws',
    upgradeWebSocket(() => {
      let consumerId: string | null = null

      return {
        onMessage(event, ws) {
          try {
            const data = serializeMessage(event)

            switch (data.type) {
              case 'c':
                registerConsumer(ws, data)
                consumerId = data.id
                break

              case 't':
                trackFeeder(ws, data)
                break

              case 'i_b':
                updateInsideBus(ws, data)
                break

              case 't_pi':
                updatePingAndBroadcast(ws, data)
                break

              case 't_dis':
                disconnectTracking(ws, data)
                break

              default:
                ws.send(
                  packMessage({
                    type: 'err',
                    message: 'bad_req'
                  })
                )
            }
          } catch (_) {
            ws.send(
              packMessage({
                type: 'err',
                message: 'bad_req'
              })
            )
          }
        },
        onClose: () => {
          if (consumerId === null) return

          removeConsumer(consumerId)
          cleanupStaleSockets()

          console.info('[HOKO]: ', consumerId, ' disconnected.')
        }
      }
    })
  )

export default {
  fetch: app.fetch,
  websocket
}
