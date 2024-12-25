export function getCoordRange(lat: number, lon: number, radiusKm = 1.5) {
	const EARTH_RADIUS_KM = 6371.0;

	// Latitude range
	const deltaLat = radiusKm / EARTH_RADIUS_KM;
	const minLat = truncate(lat - deltaLat * (180 / Math.PI), 5);
	const maxLat = truncate(lat + deltaLat * (180 / Math.PI), 5);

	// Longitude range (varies with latitude)
	const deltaLon =
		radiusKm / (EARTH_RADIUS_KM * Math.cos(lat * (Math.PI / 180)));
	const minLon = truncate(lon - deltaLon * (180 / Math.PI), 5);
	const maxLon = truncate(lon + deltaLon * (180 / Math.PI), 5);

	return { minLat, maxLat, minLon, maxLon };
}

function truncate(value: number, decimalPlaces: number) {
	const factor = Math.pow(10, decimalPlaces);
	return Math.floor(value * factor) / factor;
}
