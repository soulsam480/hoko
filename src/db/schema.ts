import { Selectable } from "kysely";
import { Generated } from "kysely";

interface StopsTable {
	id: Generated<number>;
	lat: number;
	long: number;
	name: string;
	trip_count: number;
	trip_list: string[];
	route_count: number;
	route_list: string[];
}

export type TBusStop = Selectable<StopsTable>;

export interface KyselyDatabase {
	stops: StopsTable;
}
