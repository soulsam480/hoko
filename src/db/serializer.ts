import { TBusStop } from "./schema";

export function serializeStop(res: Record<string, any>): TBusStop {
	const { trip_list, route_list, ...rest } = res;

	return {
		...rest,
		trip_list: JSON.parse(trip_list),
		route_list: JSON.parse(route_list),
	} as TBusStop;
}
