import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  SITEMAP_DB_PAGE_SIZE,
  SITEMAP_SELECT,
  SITEMAP_VIEW_COLUMNS,
  SitemapDataError,
  citySlug,
  loadSitemapRows,
  type SitemapPageResult,
  type SitemapRangeClient,
  type SitemapRow,
} from './sitemap-paging.ts'

function mockClient(pages: SitemapRow[][], onCall?: (from: number, to: number) => void): SitemapRangeClient {
  return {
    from(table) {
      assert.equal(table, 'sitemap_clinics')
      return {
        select(columns) {
          assert.equal(columns, SITEMAP_SELECT)
          return {
            order(column, options) {
              assert.equal(column, 'id')
              assert.equal(options?.ascending, true)
              return {
                async range(from, to) {
                  onCall?.(from, to)
                  const index = from / SITEMAP_DB_PAGE_SIZE
                  const data = pages[index] ?? []
                  assert.equal(to - from + 1, SITEMAP_DB_PAGE_SIZE)
                  return { data, error: null } satisfies SitemapPageResult
                },
              }
            },
          }
        },
      }
    },
  }
}

function row(city: string, slug: string, index: number): SitemapRow {
  return { id: index, city, slug }
}

describe('sitemap view columns', () => {
  it('selects only columns that exist on sitemap_clinics', () => {
    const selected = SITEMAP_SELECT.split(',').map((column) => column.trim())
    assert.deepEqual(selected, ['id', 'slug', 'city'])
    for (const column of selected) {
      assert.equal(SITEMAP_VIEW_COLUMNS.includes(column as (typeof SITEMAP_VIEW_COLUMNS)[number]), true, column)
    }
    assert.equal(selected.includes('updated_at'), false)
    assert.equal(selected.includes('glow_score'), false)
    const paging = readFileSync(new URL('./sitemap-paging.ts', import.meta.url), 'utf8')
    assert.doesNotMatch(paging, /updated_at/)
    assert.match(paging, /SITEMAP_SELECT = 'id, slug, city'/)
  })
})

describe('sitemap view paging', () => {
  it('pages sitemap_clinics with range() in pages of 1000 and keeps order', async () => {
    const ranges: Array<[number, number]> = []
    const first = Array.from({ length: 1000 }, (_, index) => row('Austin', `a-${index}`, index))
    const second = Array.from({ length: 1000 }, (_, index) => row('Miami', `m-${index}`, index))
    const third = [row('Tampa', 't-1', 1), row('', 'missing-city', 2), row('Tampa', '', 3)]
    const rows = await loadSitemapRows(mockClient([first, second, third], (from, to) => ranges.push([from, to])))

    assert.deepEqual(ranges, [
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
    assert.equal(rows.length, 2001)
    assert.equal(rows[0]?.slug, 'a-0')
    assert.equal(rows[1000]?.slug, 'm-0')
    assert.equal(rows[2000]?.slug, 't-1')
    assert.equal(rows.some((item) => !item.slug || !item.city), false)
  })

  it('walks id order without skipping or repeating rows', async () => {
    const all = Array.from({ length: 2500 }, (_, id) => row('Miami', `clinic-${id}`, id))
    const seenRanges: Array<[number, number]> = []
    const client: SitemapRangeClient = {
      from() {
        return {
          select(columns) {
            assert.equal(columns, 'id, slug, city')
            return {
              order(column, options) {
                assert.equal(column, 'id')
                assert.equal(options?.ascending, true)
                return {
                  async range(from, to) {
                    seenRanges.push([from, to])
                    return { data: all.slice(from, to + 1), error: null }
                  },
                }
              },
            }
          },
        }
      },
    }
    const rows = await loadSitemapRows(client)
    assert.deepEqual(seenRanges, [
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
    assert.deepEqual(rows.map((item) => item.id), all.map((item) => item.id))
    assert.equal(new Set(rows.map((item) => item.id)).size, rows.length)
  })

  it('does not return a partial sitemap when a later page fails', async () => {
    let calls = 0
    const client: SitemapRangeClient = {
      from() {
        return {
          select() {
            return {
              order(column) {
                assert.equal(column, 'id')
                return {
                  async range() {
                    calls += 1
                    if (calls === 1) {
                      return { data: [row('Austin', 'ok', 1)], error: null }
                    }
                    return { data: null, error: { message: 'PGRST003' } }
                  },
                }
              },
            }
          },
        }
      },
    }

    await assert.rejects(
      () => loadSitemapRows(client, 1),
      (error: unknown) => error instanceof SitemapDataError && /PGRST003/.test(error.message),
    )
  })
})

describe('sitemap url assembly', () => {
  it('keeps the clinic URL shape and does not add claim or query URLs', () => {
    assert.equal(citySlug('St. Petersburg'), 'st-petersburg')
    const build = readFileSync(new URL('./sitemap-build.ts', import.meta.url), 'utf8')
    assert.match(build, /\$\{SITE_URL\}\/clinics\/\$\{citySlug\(clinic\.city\)\}\/\$\{clinic\.slug\}/)
    assert.match(build, /s-maxage=86400/)
    assert.match(build, /stale-while-revalidate=86400/)
    assert.match(build, /stale-if-error=86400/)
    assert.match(build, /\$\{SITE_URL\}\/claim/)
    assert.doesNotMatch(build, /\/claim\/\$\{/)
    assert.doesNotMatch(build, /\?city=/)
    const paging = readFileSync(new URL('./sitemap-paging.ts', import.meta.url), 'utf8')
    assert.match(paging, /sitemap_clinics/)
    assert.match(paging, /\.order\('id'/)
    assert.match(paging, /\.range\(/)
    const buildSource = readFileSync(new URL('./sitemap-build.ts', import.meta.url), 'utf8')
    assert.doesNotMatch(buildSource, /<lastmod>/)
    const data = readFileSync(new URL('./sitemap-data.ts', import.meta.url), 'utf8')
    assert.match(data, /loadSitemapRows/)
    assert.match(data, /revalidate: SITEMAP_REVALIDATE_SECONDS/)
    assert.doesNotMatch(data, /fetchAllClinicsFromSupabase/)
    const index = readFileSync(new URL('../app/sitemap.xml/route.ts', import.meta.url), 'utf8')
    const chunk = readFileSync(new URL('../app/sitemap-chunk/[id]/route.ts', import.meta.url), 'utf8')
    const first = readFileSync(new URL('../app/sitemap/0.xml/route.ts', import.meta.url), 'utf8')
    for (const source of [index, chunk, first]) {
      assert.match(source, /export const revalidate = 86400/)
      assert.match(source, /export const maxDuration = 30/)
      assert.doesNotMatch(source, /force-dynamic/)
      assert.doesNotMatch(source, /revalidate = 0/)
    }
    const robots = readFileSync(new URL('../app/robots.ts', import.meta.url), 'utf8')
    assert.match(robots, /sitemap: \[`\$\{SITE_URL\}\/sitemap\.xml`, `\$\{SITE_URL\}\/sitemap-priority\.xml`\]/)
  })
})
