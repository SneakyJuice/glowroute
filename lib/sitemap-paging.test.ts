import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  SITEMAP_DB_PAGE_SIZE,
  SITEMAP_SELECT,
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
              assert.equal(column, 'city')
              assert.equal(options?.ascending, true)
              return {
                order(innerColumn, innerOptions) {
                  assert.equal(innerColumn, 'slug')
                  assert.equal(innerOptions?.ascending, true)
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
    },
  }
}

function row(city: string, slug: string, index: number): SitemapRow {
  return { city, slug, updated_at: `2026-01-01T00:00:${String(index % 60).padStart(2, '0')}Z` }
}

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

  it('does not return a partial sitemap when a later page fails', async () => {
    let calls = 0
    const client: SitemapRangeClient = {
      from() {
        return {
          select() {
            return {
              order() {
                return {
                  order() {
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
    assert.match(paging, /slug, city, updated_at/)
    assert.match(paging, /\.range\(/)
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
