interface Stop {
  id: number
  name: string
  lat: number
  lon: number
}

interface Route {
  id: number
  name: string
  full_name: string
  direction: number
  start: string
  stop: string
}

interface RouteToStop {
  stop_id: number
  route_id: number
}

export type { Stop, Route, RouteToStop }
