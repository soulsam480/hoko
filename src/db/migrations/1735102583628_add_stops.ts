import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// up migration code goes here...

	await db.schema
		.createTable("stops")
		.addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
		.addColumn("lat", "integer", (col) => col.notNull())
		.addColumn("long", "integer", (col) => col.notNull())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("trip_count", "integer", (col) => col.notNull())
		.addColumn("trip_list", "text", (col) => col.notNull().defaultTo("[]"))
		.addColumn("route_count", "integer", (col) => col.notNull().defaultTo("[]"))
		.addColumn("route_list", "text", (col) => col.notNull())
		.execute();
}
