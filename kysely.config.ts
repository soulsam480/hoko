import { defineConfig } from "kysely-ctl";
import { bunKysely } from "./src/db/bun";

export default defineConfig({
	migrations: {
		migrationFolder: "./src/db/migrations",
	},
	kysely: bunKysely,
});
