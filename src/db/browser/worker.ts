import initSqlJs from "sql.js";
import { Database } from "sql.js";
import sqliteWasm from "sql.js/dist/sql-wasm.wasm?url";

interface IBaseMessage {
	id: string;
}

interface FindClosestRoutes {
	type: "closest-route";
	lat: number;
	long: number;
}

export interface Response {
	id: string;
	data: any[];
	type: "suc" | "err";
}

export type Message = FindClosestRoutes;

let initPromise: Promise<void> = Promise.resolve();

class HokoProcessor {
	db: Database | null = null;

	async init() {
		try {
			const [SQL, dbBuf] = await Promise.all([
				initSqlJs({ locateFile: () => sqliteWasm }),
				fetch("hoko-db.sqlite").then((res) => res.arrayBuffer()),
			]);

			this.db = new SQL.Database(new Uint8Array(dbBuf));
			console.log(this.db);
		} catch (error) {
			console.log("[Hoko]: unable to initialize db", error);
		}
	}

	handleMessage(message: MessageEvent<Message & IBaseMessage>) {
		try {
			console.log(message);

			console.log(this.db?.exec("select * from stops limit 30"));

			this.emitMessage({
				id: message.data.id,
				data: [],
				type: "suc",
			});
		} catch (error) {
			console.error("[Hoko]: ", "processor error", error);

			this.emitMessage({
				id: message.data.id,
				data: [],
				type: "err",
			});
		}
	}

	emitMessage(message: Response) {
		postMessage(message);
	}
}

const processor = new HokoProcessor();

initPromise = processor.init();

self.addEventListener("message", async (message) => {
	await initPromise;

	processor.handleMessage(message);
});
