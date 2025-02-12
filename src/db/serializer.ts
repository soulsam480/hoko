import { TBusStop } from './schema'

export function serializeStop(res: Record<string, any>): TBusStop {
  const { route_list, ...rest } = res

  return {
    ...rest,
    route_list: JSON.parse(route_list || '[]')
  } as TBusStop
}

export function serializeSearchRoutes(res: Record<string, any>[]): string[] {
  return res.map(it => it.matched_route)
}
