import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import { Client, ClientError, clients } from './lib/client'
import { unpackMessage } from './lib/transport'

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()

function cleanupStaleSockets() {
  for (const socket of clients.entries()) {
    if (socket[1].ws.readyState === 3) {
      socket[1].removeSelf()
    }
  }
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
      let client: Client | null = null

      return {
        onMessage(event, ws) {
          try {
            const data = unpackMessage(event)

            switch (data.type) {
              case 'c':
                client = Client.create(ws, data)
                break

              case 't':
                client = Client.find(data.id, ws)

                Client.track(data.feeder_id, client)
                break

              case 'i_b':
                client = Client.find(data.id, ws)
                client.setInsideBus(data.inside_bus)
                break

              case 't_pi':
                client = Client.find(data.id, ws)
                client.setCoordinates(data.coordinates)
                break

              case 't_dis':
                client = Client.find(data.id, ws)
                Client.untrack(data.feeder_id, client)
                break

              case 'f':
                client = Client.find(data.id, ws)
                client.findFeeders(data)
                break

              default:
                throw new ClientError(ws, {
                  type: 'err',
                  message: 'bad_req'
                })
            }
          } catch (error) {
            if (error instanceof ClientError) {
              error.send()
            }
          }
        },
        onClose: () => {
          if (client === null) return

          client.removeSelf()
          cleanupStaleSockets()

          console.info('[HOKO]: ', client.id, ' disconnected.')
        }
      }
    })
  )

export default {
  fetch: app.fetch,
  websocket,
  hostname: '192.168.0.107',
  tls: {
    cert: Bun.file('zorodev.test+4.pem'),
    key: Bun.file('zorodev.test+4-key.pem')
  }
}
