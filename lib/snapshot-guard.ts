/**
 * Per-process guard for a read that can stampede a saturated database.
 * Concurrent callers share one load. After a failure the guard stays open
 * and serves the last usable snapshot, or fails immediately when there is none.
 */
export type SnapshotGuard<T> = {
  get(): Promise<T>
  isOpen(at?: number): boolean
  lastError(): unknown
  snapshot(): T | null
  trip(error: unknown, at?: number): void
}

export function createSnapshotGuard<T>(options: {
  openMs: number
  freshMs?: number
  now?: () => number
  load: () => Promise<T>
  isUsable?: (value: T) => boolean
  onServeStale?: (error: unknown) => void
}): SnapshotGuard<T> {
  const now = options.now ?? Date.now
  const isUsable = options.isUsable ?? ((value: T) => value != null)

  let snapshot: T | null = null
  let snapshotAt = 0
  let openUntil = 0
  let lastError: unknown = null
  let inflight: Promise<T> | null = null

  function serveOpen(at: number): T {
    if (snapshot != null && isUsable(snapshot)) return snapshot
    if (lastError instanceof Error) throw lastError
    throw new Error(`Circuit breaker open for ${Math.max(0, openUntil - at)}ms`)
  }

  return {
    isOpen(at = now()) {
      return at < openUntil
    },
    lastError() {
      return lastError
    },
    snapshot() {
      return snapshot
    },
    trip(error: unknown, at = now()) {
      openUntil = at + options.openMs
      lastError = error
    },
    get() {
      const at = now()
      if (at < openUntil) return Promise.resolve().then(() => serveOpen(at))
      if (
        snapshot != null &&
        isUsable(snapshot) &&
        options.freshMs != null &&
        at - snapshotAt < options.freshMs
      ) {
        return Promise.resolve(snapshot)
      }
      if (inflight) return inflight

      const run = (async () => {
        try {
          const value = await options.load()
          const loadedAt = now()
          if (isUsable(value)) {
            snapshot = value
            snapshotAt = loadedAt
          }
          openUntil = 0
          lastError = null
          return value
        } catch (error) {
          openUntil = now() + options.openMs
          lastError = error
          if (snapshot != null && isUsable(snapshot)) {
            options.onServeStale?.(error)
            return snapshot
          }
          throw error
        } finally {
          inflight = null
        }
      })()

      inflight = run
      return run
    },
  }
}
