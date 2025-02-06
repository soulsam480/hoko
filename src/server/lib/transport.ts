// NOTE: ------------------ utils ----------------

import { WSMessageReceive } from 'hono/ws'
import {
  IConnectionRequest,
  IInsideBusRequest,
  ITrackingRequest,
  IFeederPingRequest,
  ITrackingDisconnectionRequest,
  IConnectionResponse,
  ITrackingResponse,
  ISubscriberPongResponse,
  IConsumerDisconnectedResponse,
  IErrorResponse,
  IFindFeedersRequest,
  IFindFeedersResponse
} from '../../messages'

export function unpackMessage(
  message: MessageEvent<WSMessageReceive>
):
  | IConnectionRequest
  | IInsideBusRequest
  | ITrackingRequest
  | IFeederPingRequest
  | ITrackingDisconnectionRequest
  | IFindFeedersRequest {
  const data = JSON.parse(message.data.toString())

  if (!('type' in data)) {
    throw new Error('Bad request')
  }

  return data
}

export function packMessage(
  message:
    | IConnectionResponse
    | ITrackingResponse
    | ISubscriberPongResponse
    | IConsumerDisconnectedResponse
    | IErrorResponse
    | IFindFeedersResponse
) {
  return JSON.stringify(message)
}
