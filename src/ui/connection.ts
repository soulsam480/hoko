import type { GDB, RoomChannel } from 'genosdb'
import type { Route } from '../db/schema'
import {
  connectionState,
  feeders,
  insideBus as storesInsideBus
} from './stores'
import { USER_ID } from './userId'

let db: GDB | undefined
let gpsChannel: RoomChannel | undefined
let gpsMessageHandler:
  | ((data: { userId: string; lat: number; lon: number }) => void)
  | undefined
let broadcastTimer: ReturnType<typeof setInterval> | undefined
let _sweepTimer: ReturnType<typeof setInterval> | undefined
let currentRouteId: number | undefined
let gpsPos: { lat: number; lon: number } | undefined

async function ensureDB() {
  if (db) return

  const { gdb } = await import('genosdb')

  db = await gdb('hoko', { rtc: true })

  _sweepTimer = setInterval(() => {
    const now = Date.now()
    const arr = feeders.peek()
    if (arr.length === 0) return
    const filtered = arr.filter(
      f => now - f.lastSeen < 120_000 && f.userId !== USER_ID
    )
    if (filtered.length !== arr.length) {
      feeders.value = filtered
    }
  }, 30_000)
}

export function toggleInsideBus(active: boolean) {
  storesInsideBus.value = active
  if (!db) return

  if (active) {
    startBroadcast()
  } else {
    stopBroadcast()
    const arr = feeders.peek()
    const filtered = arr.filter(f => f.userId !== USER_ID)
    if (filtered.length !== arr.length) {
      feeders.value = filtered
    }
  }
}

export async function joinRoute(route: Route) {
  if (currentRouteId === route.id && gpsChannel) return
  await leaveRoute()

  currentRouteId = route.id
  connectionState.value = 'joining'

  try {
    await ensureDB()

    gpsChannel = db?.room?.channel(`gps-${route.id}`)

    if (!gpsChannel) {
      throw new Error('failed to create channel')
    }

    gpsChannel.on(
      'message',
      (gpsMessageHandler = (data: {
        userId: string
        lat: number
        lon: number
      }) => {
        if (data.userId === USER_ID) return

        const arr = feeders.peek()
        const idx = arr.findIndex(f => f.userId === data.userId)

        if (idx === -1) {
          feeders.value = [
            ...arr,
            {
              userId: data.userId,
              lat: data.lat,
              lon: data.lon,
              lastSeen: Date.now()
            }
          ]
          return
        }

        const next = arr.slice()
        next[idx] = {
          ...next[idx],
          lat: data.lat,
          lon: data.lon,
          lastSeen: Date.now()
        }
        feeders.value = next
      })
    )

    if (storesInsideBus.value) {
      startBroadcast()
    }

    connectionState.value = 'joined'
  } catch (err) {
    console.error('[connection] failed to join room:', err)
    connectionState.value = 'error'
  }
}

export async function leaveRoute() {
  stopBroadcast()

  if (gpsChannel && gpsMessageHandler) {
    gpsChannel.off('message', gpsMessageHandler)
  }
  gpsChannel = undefined
  gpsMessageHandler = undefined
  currentRouteId = undefined
  feeders.value = []
  connectionState.value = 'idle'
}

export function updatePosition(loc: GeolocationCoordinates) {
  gpsPos = { lat: loc.latitude, lon: loc.longitude }
}

function broadcast() {
  if (!gpsChannel || !gpsPos) return
  gpsChannel.send({ userId: USER_ID, lat: gpsPos.lat, lon: gpsPos.lon })
}

function startBroadcast() {
  if (broadcastTimer) return
  broadcast()
  broadcastTimer = setInterval(broadcast, 5_000)
}

function stopBroadcast() {
  if (broadcastTimer) {
    clearInterval(broadcastTimer)
    broadcastTimer = undefined
  }
}

export const connection = {
  joinRoute,
  leaveRoute,
  toggleInsideBus,
  insideBus: storesInsideBus,
  updatePosition
}
