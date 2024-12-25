import { signal, effect } from '@preact/signals-core'

interface CustomStorage {
  getItem(key: string): string
  setItem(key: string, value: string | null): void
}

/**
 * A version of signal() that persists and recalls its value in localStorage.
 * @example
 *   const db = persistedSignal({}, 'db');
 *   db.value = {...db.value, newKey: 1});  // saves to localStorage.db
 *
 *   // in a new page/tab/JS context:
 *   const db = persistedSignal({}, 'db');
 *   db.value.newKey; // 1  (loaded from localStoage.db)
 */
export function persistedSignal<T>(
  initialValue: T,
  key: string,
  storage: Storage | CustomStorage = localStorage
) {
  const sig = signal(initialValue)
  let skipSave = true

  // try to hydrate state from storage:
  function load() {
    skipSave = true
    try {
      const stored = JSON.parse(storage.getItem(key) ?? 'null')

      if (stored != null) sig.value = stored
    } catch (err) {
      // ignore blocked storage access
    }

    skipSave = false
  }

  effect(() => {
    const value = sig.value

    if (skipSave) return

    try {
      storage.setItem(key, JSON.stringify(value))
    } catch (err) {}
  })

  // if another tab changes the launch tracking state, update our in-memory copy:
  // if (typeof addEventListener === 'function') {
  //   addEventListener('storage', ev => {
  //     if (ev. === key) load()
  //   })
  // }

  load()

  return sig
}
