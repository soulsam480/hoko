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
  IErrorResponse
} from '../../messages'

export function unpackMessage(
  message: MessageEvent<WSMessageReceive>
):
  | IConnectionRequest
  | IInsideBusRequest
  | ITrackingRequest
  | IFeederPingRequest
  | ITrackingDisconnectionRequest {
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
) {
  return JSON.stringify(message)
}
