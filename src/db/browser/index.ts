import { SQLocal } from "sqlocal";

const { sql, overwriteDatabaseFile } = new SQLocal("hoko.sqlite");

const hasDbInit = localStorage.getItem("init_db");

async function initDatabase() {
	if (hasDbInit !== null) return;

	const data = await fetch("hoko-db.sqlite").then((res) => res.blob());

	await overwriteDatabaseFile(data);

	localStorage.setItem("init_db", "true");
}

const dbPromise = initDatabase();

async function isReady() {
	await dbPromise;
}

export { sql, isReady };
