import type { FeederPresence } from '../ui/stores'

export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function clusterFeeders(feeders: FeederPresence[], threshold = 50) {
  const byRoute = new Map<number, FeederPresence[]>()
  for (const f of feeders) {
    const list = byRoute.get(f.routeId) || []
    list.push(f)
    byRoute.set(f.routeId, list)
  }

  const allClusters: {
    center: [number, number]
    count: number
    ids: string[]
    routeId: number
  }[] = []

  for (const [routeId, routeFeeders] of byRoute) {
    const remaining = [...routeFeeders]
    while (remaining.length > 0) {
      const pivot = remaining.shift()!
      const group = [pivot]
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (
          haversine(pivot.lat, pivot.lon, remaining[i].lat, remaining[i].lon) <=
          threshold
        ) {
          group.push(remaining[i])
          remaining.splice(i, 1)
        }
      }
      allClusters.push({
        center: [
          group.reduce((s, f) => s + f.lat, 0) / group.length,
          group.reduce((s, f) => s + f.lon, 0) / group.length
        ],
        count: group.length,
        ids: group.map(f => f.userId).sort(),
        routeId
      })
    }
  }

  return allClusters
}
