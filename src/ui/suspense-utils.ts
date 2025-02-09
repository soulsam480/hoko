type AsyncReturnType<T extends () => Promise<unknown>> =
  T extends () => Promise<infer R> ? R : never

const cache = new Map<string, () => any>()

export function suspendFn<T extends () => Promise<unknown>>(
  key: string,
  fn: T
): () => AsyncReturnType<T> {
  if (cache.has(key)) return cache.get(key)!

  let status: 'pending' | 'fulfilled' | 'rejected' = 'pending'
  let result: any

  let fetching = fn()
    .then(success => {
      status = 'fulfilled'
      result = success
    })
    .catch(error => {
      status = 'rejected'
      result = error
    })

  const suspender = () => {
    if (status === 'pending') throw fetching
    if (status === 'rejected') throw result
    return result
  }

  cache.set(key, suspender)

  return suspender
}
