import type { GDB, RoomChannel } from 'genosdb'
import type { Route } from '../db/schema'
import {
  connectionState,
  type FeederPresence,
  feeders,
  presenceIndex,
  insideBus as storesInsideBus
} from './stores'
import { USER_ID } from './userId'

class Connection {
  private db: GDB | undefined
  private gpsChannel: RoomChannel | undefined
  private gpsHandler:
    | ((data: { userId: string; lat: number; lon: number }) => void)
    | undefined
  private gpsTimer: ReturnType<typeof setInterval> | undefined
  private sweepTimer: ReturnType<typeof setInterval> | undefined
  private routeId: number | undefined
  private pos: { lat: number; lon: number } | undefined
  private presenceChannel: RoomChannel | undefined
  private presenceBroadcastTimer: ReturnType<typeof setInterval> | undefined
  private presenceSweepTimer: ReturnType<typeof setInterval> | undefined

  private async ensureDB() {
    if (this.db) return

    const { gdb } = await import('genosdb')

    this.db = await gdb('hoko', { rtc: true })

    this.sweepTimer = setInterval(() => {
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

  async init() {
    try {
      await this.ensureDB()

      if (!this.db?.room) return

      this.presenceChannel = this.db.room.channel('presence')

      if (!this.presenceChannel) return

      this.presenceChannel.on('message', (data: FeederPresence) => {
        if (data.userId === USER_ID) return

        const index = presenceIndex.peek()
        const routeFeeders = index.get(data.routeId) || []
        const idx = routeFeeders.findIndex(f => f.userId === data.userId)

        if (idx === -1) {
          presenceIndex.value = new Map(index).set(data.routeId, [
            ...routeFeeders,
            { ...data, lastSeen: Date.now() }
          ])
        } else {
          const updated = [...routeFeeders]
          updated[idx] = {
            ...updated[idx],
            lat: data.lat,
            lon: data.lon,
            lastSeen: Date.now()
          }
          presenceIndex.value = new Map(index).set(data.routeId, updated)
        }
      })

      this.presenceSweepTimer = setInterval(() => {
        const now = Date.now()
        const index = presenceIndex.peek()
        let changed = false
        const next = new Map(index)

        for (const [routeId, feeders] of next) {
          const filtered = feeders.filter(
            f => now - f.lastSeen < 90_000 && f.userId !== USER_ID
          )
          if (filtered.length !== feeders.length) {
            changed = true
            if (filtered.length === 0) {
              next.delete(routeId)
            } else {
              next.set(routeId, filtered)
            }
          }
        }

        if (changed) {
          presenceIndex.value = next
        }
      }, 30_000)
    } catch (err) {
      console.error('[connection] presence init failed:', err)
    }
  }

  toggleInsideBus(active: boolean) {
    storesInsideBus.value = active
    if (!this.db) return

    if (active) {
      this.startGPS()
    } else {
      this.stopGPS()
    }
  }

  async joinRoute(route: Route) {
    if (this.routeId === route.id && this.gpsChannel) return
    await this.leaveRoute()

    this.routeId = route.id
    connectionState.value = 'joining'

    try {
      await this.ensureDB()

      if (!this.db?.room) {
        throw new Error('db room not available')
      }

      this.gpsChannel = this.db.room.channel(`gps-${route.id}`)

      if (!this.gpsChannel) {
        throw new Error('failed to create channel')
      }

      this.gpsChannel.on(
        'message',
        (this.gpsHandler = (data: {
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
        this.startGPS()
      }

      connectionState.value = 'joined'
    } catch (err) {
      console.error('[connection] failed to join room:', err)
      connectionState.value = 'error'
    }
  }

  async leaveRoute() {
    this.stopGPS()

    if (this.gpsChannel && this.gpsHandler) {
      this.gpsChannel.off('message', this.gpsHandler)
    }
    this.gpsChannel = undefined
    this.gpsHandler = undefined
    this.routeId = undefined
    feeders.value = []
    // NOTE: presenceIndex is intentionally NOT cleared here.
    // Presence is city-wide data, not route-specific. Clearing it
    // on leaveRoute would erase feeder badges for other routes.
    connectionState.value = 'idle'
  }

  updatePosition(loc: GeolocationCoordinates) {
    this.pos = { lat: loc.latitude, lon: loc.longitude }
  }

  private gpsBroadcast() {
    if (!this.gpsChannel || !this.pos) return
    this.gpsChannel.send({
      userId: USER_ID,
      lat: this.pos.lat,
      lon: this.pos.lon
    })
  }

  private startGPS() {
    if (this.gpsTimer) return
    this.gpsBroadcast()
    this.gpsTimer = setInterval(() => this.gpsBroadcast(), 5_000)
    this.startPresenceBroadcast()
  }

  private stopGPS() {
    if (this.gpsTimer) {
      clearInterval(this.gpsTimer)
      this.gpsTimer = undefined
    }
    this.stopPresenceBroadcast()
  }

  private sendPresence() {
    if (!this.presenceChannel || !this.pos || !this.routeId) return
    this.presenceChannel.send({
      userId: USER_ID,
      routeId: this.routeId,
      lat: this.pos.lat,
      lon: this.pos.lon,
      lastSeen: Date.now()
    })
  }

  private startPresenceBroadcast() {
    if (this.presenceBroadcastTimer) return
    this.sendPresence()
    this.presenceBroadcastTimer = setInterval(() => this.sendPresence(), 20_000)
  }

  private stopPresenceBroadcast() {
    if (this.presenceBroadcastTimer) {
      clearInterval(this.presenceBroadcastTimer)
      this.presenceBroadcastTimer = undefined
    }
  }
}

export const connection = new Connection()
