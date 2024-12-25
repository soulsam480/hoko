import { bunKysely } from "../src/db/bun";

async function main() {
	const file = Bun.file("bmtc-data.geojson");

	const json = await file.json();

	await bunKysely.transaction().execute(async (trx) => {
		for (const feature of json.features) {
			const { route_list, trip_list, ...rest } = feature.properties;

			const [lat, long] = feature.geometry.coordinates;

			const name = await trx
				.insertInto("stops")
				.values({
					...rest,
					lat,
					long,
					route_list: JSON.stringify(route_list),
					trip_list: JSON.stringify(trip_list),
				})
				.returning("stops.name")
				.execute();

			console.log("Done inseting: ", name);
		}
	});
}

main();
