import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SUPABASE_FETCH_TIMEOUT_MS, supabaseFetch } from './supabase.ts'

describe('supabase fetch timeout', () => {
  it('uses an 8 second abort signal on every request', async () => {
    assert.equal(SUPABASE_FETCH_TIMEOUT_MS, 8_000)
    const original = globalThis.fetch
    const controller = new AbortController()
    controller.abort()
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      assert.ok(init?.signal)
      assert.equal(init.signal.aborted, true)
      throw new DOMException('The operation was aborted', 'AbortError')
    }) as typeof fetch
    try {
      await assert.rejects(
        () => supabaseFetch('https://example.test/rest/v1/clinics', { signal: controller.signal }),
        (error: unknown) => error instanceof DOMException && error.name === 'AbortError',
      )
    } finally {
      globalThis.fetch = original
    }
  })
})
