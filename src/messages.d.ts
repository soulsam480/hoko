export interface IConsumer {
  id: string
  inside_bus: boolean
  route_id: string | null
  stop_id: number | null
  coordinates: [lat: number, lng: number]
  subs: Set<string>
}

export interface IConsumableFeeder {
  id: string
  coordinates: [lat: number, lng: number]
}

export interface IConnectionRequest {
  type: 'c'
  id: string
  route_id: string | null
  stop_id: number | null
  inside_bus: boolean
  coordinates: [lat: number, lng: number]
  feeder_id: string | null
}

export interface IConnectionResponse {
  type: 'c_s'
  id: string
  feeders: Array<IConsumableFeeder>
}

export interface ITrackingRequest {
  type: 't'
  id: string
  feeder_id: string
  route_id: string
  stop_id: number
}

export interface ITrackingResponse {
  type: 't_s'
  id: string
  feeder_id: string
  coordinates: [lat: number, lng: number]
}

interface ITrackingDisconnectionRequest {
  type: 't_dis'
  id: string
  feeder_id: string
}

export interface IInsideBusRequest {
  type: 'i_b'
  id: string
  inside_bus: boolean
}

export interface IFeederPingRequest {
  type: 't_pi'
  id: string
  coordinates: [lat: number, lng: number]
}

export interface ISubscriberPongResponse {
  type: 't_po'
  id: string
  feeder_id: string
  coordinates: [lat: number, lng: number]
}

export interface IConsumerDisconnectedResponse {
  type: 'dis'
  id: string
  feeder_id: string
}

export interface IErrorResponse {
  type: 'err'
  message: string
}

export interface IFindFeedersRequest {
  type: 'f'
  id: string
  stop_id: number
  route_id: string
}

export interface IFindFeedersResponse {
  type: 'f_s'
  feeders: Array<IConsumableFeeder>
}
