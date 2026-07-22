import { client } from './client'
import { getCoordRange } from './location'
import type { Stop, Route } from './schema'

export async function getClosestStops(
  coords: GeolocationCoordinates
): Promise<Stop[]> {
  const { minLat, maxLat, minLon, maxLon } = getCoordRange(
    coords.latitude,
    coords.longitude,
    1
  )

  const stops = await client.sql<Stop>`SELECT id,lat,lon,name
FROM stops
WHERE lat BETWEEN ${minLat} AND ${maxLat}
  AND lon BETWEEN ${minLon} AND ${maxLon}`

  return stops
}

export async function getSearchedRoutes(
  id: number,
  term: string
): Promise<Route[]> {
  if (term.length === 0) {
    const routes = await client.sql<Route>`SELECT r.*
FROM routes_to_stops rs
JOIN routes r
  ON r.id = rs.route_id
WHERE rs.stop_id = ${id}
LIMIT 10;`

    return routes
  }

  const routes = await client.sql<Route>`SELECT r.*
FROM routes_to_stops rs
JOIN routes r ON r.id = rs.route_id
WHERE rs.stop_id = ${id}
  AND r.name LIKE '%' || ${term} || '%'
LIMIT 10;`

  return routes
}

export async function getStopsForRoute(routeId: number): Promise<Stop[]> {
  const stops = await client.sql<Stop>`SELECT s.id, s.lat, s.lon, s.name
FROM stops s
JOIN routes_to_stops rs ON rs.stop_id = s.id
WHERE rs.route_id = ${routeId}`

  return stops
}
