import { Response, Message as WorkerMessage } from "./worker";
import HokoProcessor from "./worker?worker";

const worker = new HokoProcessor();

const runningQuries = new Map<
	string,
	[resolve: (message: any) => void, reject: (error: unknown) => void]
>();

export async function execQuery<T>(message: WorkerMessage): Promise<T> {
	const id = window.crypto.randomUUID();

	worker.postMessage({
		...message,
		id,
	});

	return new Promise((res, rej) => {
		runningQuries.set(id, [res, rej]);
	});
}

worker.addEventListener("message", (event) => {
	if (event.data.id !== undefined) {
		const data = event.data as Response;

		const query = runningQuries.get(data.id);

		if (query) {
			const [resolve, reject] = query;

			if (data.type === "suc") {
				resolve(data);
			} else {
				reject(data);
			}
		}

		runningQuries.delete(data.id);
	}
});

async function main() {
	console.log(
		await execQuery({
			lat: 10,
			long: 10,
			type: "closest-route",
		}),
	);
}

main();
