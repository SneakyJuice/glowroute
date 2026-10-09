import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  DIRECTORY_COLUMNS,
  DIRECTORY_SELECT,
  compareDirectoryOrder,
  cursorFromDirectoryRow,
  collectDirectoryPages,
  dedupeClinicsBySlug,
  directoryKeysetFilter,
  encodeDirectoryCursor,
  decodeDirectoryCursor,
  filterClinicsForCitySlug,
  isAfterDirectoryCursor,
  type DirectoryCursor,
  type DirectorySortKey,
} from './clinic-directory.ts'

const SENSITIVE_COLUMNS = [
  'email',
  'contact_email',
  'contact_phone',
  'contact_name',
  'contact_linkedin',
  'stripe_customer_id',
  'subscription_id',
  'place_id',
  'primary_contact_id',
]

describe('directory column projection', () => {
  it('names the columns the directory reads and leaves internal columns out', () => {
    assert.equal(DIRECTORY_SELECT.includes('*'), false)
    assert.ok(DIRECTORY_COLUMNS.includes('slug'))
    assert.ok(DIRECTORY_COLUMNS.includes('glow_score'))
    assert.ok(DIRECTORY_COLUMNS.includes('id'))
    for (const column of SENSITIVE_COLUMNS) {
      assert.equal(DIRECTORY_COLUMNS.includes(column as never), false, column)
    }
  })

  it('does not page clinics with select=*', () => {
    const source = readFileSync(new URL('../data/supabase-clinics.ts', import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\.select\(\s*['"`]\*['"`]\s*\)/)
    assert.match(source, /DIRECTORY_SELECT/)
    assert.match(source, /directoryKeysetFilter/)
    assert.match(source, /unstable_cache/)
    assert.match(source, /glowroute-visible-clinics-version-v2/)
    assert.match(source, /loadVersionedDirectoryPage\(version/)
    assert.match(source, /DIRECTORY_MEMO_MAX_CLINICS/)
    assert.match(source, /Stopped after/)
    assert.match(source, /last good directory list/)
    assert.match(source, /unstable_noStore\(\)/)
    assert.match(source, /Error fetching clinic/)
    assert.doesNotMatch(source, /if \(error \|\| !data \|\| data\.length === 0\) return null/)
  })

  it('shows a branded unavailable page and a 503 for the clinics API', () => {
    const errorPage = readFileSync(new URL('../app/error.tsx', import.meta.url), 'utf8')
    assert.match(errorPage, /Temporarily unavailable/)
    assert.match(errorPage, /Try again/)
    assert.match(errorPage, /GlowRoute/)
    const api = readFileSync(new URL('../app/api/clinics/route.ts', import.meta.url), 'utf8')
    assert.match(api, /status: 503/)
    assert.match(api, /Retry-After/)
    assert.match(api, /no-store/)
  })
})

describe('directory keyset order', () => {
  const rows: DirectorySortKey[] = [
    { glowScore: 5, id: 'c' },
    { glowScore: 5, id: 'a' },
    { glowScore: 5, id: 'b' },
    { glowScore: 4, id: 'd' },
    { glowScore: null, id: 'e' },
    { glowScore: 2, id: 'f' },
  ]

  it('orders equal scores by id and places null scores last', () => {
    const ordered = [...rows].sort(compareDirectoryOrder)
    assert.deepEqual(
      ordered.map((row) => row.id),
      ['a', 'b', 'c', 'd', 'f', 'e'],
    )
  })

  it('pages without skipping or repeating rows when scores tie', () => {
    const ordered = [...rows].sort(compareDirectoryOrder)
    const seen: string[] = []
    let cursor: DirectoryCursor | null = null
    const pageSize = 2

    while (seen.length < ordered.length) {
      const page = ordered
        .filter((row) => (cursor ? isAfterDirectoryCursor(row, cursor) : true))
        .slice(0, pageSize)
      assert.ok(page.length > 0)
      seen.push(...page.map((row) => row.id))
      const last = page[page.length - 1]
      cursor = { glowScore: last.glowScore, id: last.id }
    }

    assert.deepEqual(seen, ordered.map((row) => row.id))
  })

  it('builds a filter that includes the id tiebreaker and trailing null scores', () => {
    assert.equal(directoryKeysetFilter(null), null)
    const filter = directoryKeysetFilter({ glowScore: 5, id: 'b' })
    assert.match(filter ?? '', /glow_score\.lt\.5/)
    assert.match(filter ?? '', /glow_score\.eq\.5/)
    assert.match(filter ?? '', /id\.gt\.b/)
    assert.match(filter ?? '', /glow_score\.is\.null/)
    assert.equal(
      directoryKeysetFilter({ glowScore: null, id: 'e' }),
      'and(glow_score.is.null,id.gt.e)',
    )
  })

  it('round-trips the cursor used as the cache key', () => {
    const cursor = cursorFromDirectoryRow({ glow_score: '4.0', id: 'abc' })
    assert.deepEqual(cursor, { glowScore: 4, id: 'abc' })
    assert.deepEqual(decodeDirectoryCursor(encodeDirectoryCursor(cursor)), cursor)
    assert.equal(decodeDirectoryCursor(''), null)
    assert.deepEqual(cursorFromDirectoryRow({ glow_score: null, id: 12 }), {
      glowScore: null,
      id: '12',
    })
  })
})

describe('directory page collection', () => {
  it('warns when the page cap is hit before the list ends', async () => {
    const warnings: number[] = []
    const clinics = await collectDirectoryPages(
      async (cursorKey) => ({
        clinics: [{ id: cursorKey || '0' }],
        nextCursorKey: String(Number(cursorKey || '0') + 1),
        done: false,
      }),
      3,
      (maxPages) => warnings.push(maxPages),
    )
    assert.equal(clinics.length, 3)
    assert.deepEqual(warnings, [3])
  })

  it('does not warn when the last page finishes the list', async () => {
    const warnings: number[] = []
    const clinics = await collectDirectoryPages(
      async () => ({ clinics: [{ id: 'only' }], nextCursorKey: '', done: true }),
      3,
      (maxPages) => warnings.push(maxPages),
    )
    assert.equal(clinics.length, 1)
    assert.deepEqual(warnings, [])
  })

  it('does not return a partial list when a later page fails', async () => {
    await assert.rejects(
      () =>
        collectDirectoryPages(
          async (cursorKey) => {
            if (cursorKey) throw new Error('page failed')
            return { clinics: [{ id: '1' }], nextCursorKey: 'next', done: false }
          },
          5,
          () => {},
        ),
      /page failed/,
    )
  })
})

describe('city filter', () => {
  const clinics = [
    { id: '1', slug: 'a', city: 'Miami Beach', glowScore: 5 },
    { id: '2', slug: 'b', city: 'Miami', glowScore: 4 },
    { id: '3', slug: 'c', city: 'miami beach', glowScore: 3 },
  ]

  it('prefers an exact city name and otherwise matches case-insensitively', () => {
    assert.deepEqual(
      filterClinicsForCitySlug(clinics, 'miami-beach').map((clinic) => clinic.id),
      ['1'],
    )
    assert.deepEqual(
      filterClinicsForCitySlug(
        clinics.filter((clinic) => clinic.id !== '1'),
        'miami-beach',
      ).map((clinic) => clinic.id),
      ['3'],
    )
  })

  it('keeps the highest score when slugs repeat', () => {
    const unique = dedupeClinicsBySlug([
      { id: 'b', slug: 'same', city: 'Miami', glowScore: 4 },
      { id: 'a', slug: 'same', city: 'Miami', glowScore: 5 },
      { id: 'c', slug: 'other', city: 'Miami', glowScore: 2 },
      { id: 'd', slug: '', city: 'Miami', glowScore: 5 },
    ])
    assert.deepEqual(
      unique.map((clinic) => clinic.id),
      ['a', 'c'],
    )
  })
})
