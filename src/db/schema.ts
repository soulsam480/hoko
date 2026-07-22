interface StopsTable {
  lat: number
  long: number
  name: string
  trip_count: number
  trip_list: string[]
  route_count: number
  route_list: string[]
}

export type TBusStop = StopsTable
