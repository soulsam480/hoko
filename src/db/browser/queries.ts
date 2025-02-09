import { sql } from '.'
import { serializeSearchRoutes, serializeStop } from '../serializer'
import { getCoordRange } from './locationUtils'

export async function getClosestStops(coords: GeolocationCoordinates) {
  const { minLat, maxLat, minLon, maxLon } = getCoordRange(
    coords.latitude,
    coords.longitude,
    1
  )

  const stops = await sql`SELECT *
FROM stops
WHERE lat BETWEEN ${minLat} AND ${maxLat}
  AND long BETWEEN ${minLon} AND ${maxLon}`

  return stops.map(serializeStop)
}

export async function getSearchedRoutes(
  id: number,
  term: string
): Promise<string[]> {
  const searchTerm = `%${term}%`

  const routes = await sql`
    SELECT json_each.value AS matched_route
    FROM stops, json_each(route_list)
    WHERE stops.id = ${id}
    AND json_each.value LIKE ${searchTerm} COLLATE NOCASE;
  `

  return serializeSearchRoutes(routes)
}
