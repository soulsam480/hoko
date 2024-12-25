if (typeof document !== "undefined") {
	throw new Error("bun only");
}

import { Kysely } from "kysely";
import { BunSqliteDialect } from "kysely-bun-sqlite";
import { Database } from "bun:sqlite";
import { KyselyDatabase } from "./schema";

const bunKysely = new Kysely<KyselyDatabase>({
	dialect: new BunSqliteDialect({
		database: new Database("hoko-db.sqlite"),
	}),
});

export { bunKysely };
