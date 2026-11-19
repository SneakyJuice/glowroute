import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createSnapshotGuard } from './snapshot-guard.ts'

function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  let reject: (error: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('directory snapshot guard', () => {
  it('coalesces concurrent loads onto one shared promise', async () => {
    let calls = 0
    const gate = deferred<string[]>()
    const guard = createSnapshotGuard({
      openMs: 60_000,
      load: () => {
        calls += 1
        return gate.promise
      },
      isUsable: (rows) => rows.length > 0,
    })

    const first = guard.get()
    const second = guard.get()
    const third = guard.get()
    assert.equal(calls, 1)
    gate.resolve(['miami'])
    assert.deepEqual(await Promise.all([first, second, third]), [['miami'], ['miami'], ['miami']])
    assert.equal(calls, 1)
  })

  it('opens for 60 seconds after a failure and serves the last good snapshot', async () => {
    let now = 0
    let calls = 0
    const guard = createSnapshotGuard({
      openMs: 60_000,
      freshMs: 1_000,
      now: () => now,
      load: async () => {
        calls += 1
        if (calls === 1) return ['good']
        throw new Error('Timed out acquiring connection from connection pool')
      },
      isUsable: (rows) => rows.length > 0,
    })

    assert.deepEqual(await guard.get(), ['good'])
    now = 1_000
    assert.deepEqual(await guard.get(), ['good'])
    assert.equal(calls, 2)
    assert.equal(guard.isOpen(), true)

    now = 1_000 + 59_000
    assert.deepEqual(await guard.get(), ['good'])
    assert.equal(calls, 2)

    now = 1_000 + 60_000
    assert.deepEqual(await guard.get(), ['good'])
    assert.equal(calls, 3)
    assert.equal(guard.isOpen(), true)
  })

  it('fails fast while open when no snapshot exists', async () => {
    let now = 0
    let calls = 0
    const guard = createSnapshotGuard({
      openMs: 60_000,
      now: () => now,
      load: async () => {
        calls += 1
        throw new Error('PGRST003')
      },
    })

    await assert.rejects(() => guard.get(), /PGRST003/)
    assert.equal(calls, 1)
    await assert.rejects(() => guard.get(), /PGRST003/)
    assert.equal(calls, 1)

    now = 60_000
    await assert.rejects(() => guard.get(), /PGRST003/)
    assert.equal(calls, 2)
  })

  it('lets an outside failure trip the breaker without starting another load', async () => {
    let calls = 0
    const guard = createSnapshotGuard({
      openMs: 60_000,
      freshMs: 0,
      load: async () => {
        calls += 1
        return ['directory']
      },
      isUsable: (rows) => rows.length > 0,
    })

    assert.deepEqual(await guard.get(), ['directory'])
    guard.trip(new Error('pool timeout'))
    assert.equal(guard.isOpen(), true)
    assert.deepEqual(await guard.get(), ['directory'])
    assert.equal(calls, 1)
    assert.match(String(guard.lastError()), /pool timeout/)
  })
})
