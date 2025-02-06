import { Signal } from '@preact/signals'

export function updatePartial<T>(signal: Signal<T>) {
  return (params: Partial<T>) => {
    signal.value = {
      ...signal.peek(),
      ...params
    }
  }
}
