import mitt from 'mitt'
import { Client } from './client'

type GlobalEvents = {
  'update:registry': Client
}

export const globalBus = mitt<GlobalEvents>()
