import { sql } from ".";
import { serializeStop } from "../serializer";
import { getCoordRange } from "./locationUtils";

export async function getClosestStops(coords: GeolocationCoordinates) {
	const { minLat, maxLat, minLon, maxLon } = getCoordRange(
		coords.latitude,
		coords.longitude,
		1,
	);

	const stops = await sql`SELECT *
FROM stops
WHERE lat BETWEEN ${minLat} AND ${maxLat}
  AND long BETWEEN ${minLon} AND ${maxLon}`;

	return stops.map(serializeStop);
}
