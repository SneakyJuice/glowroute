export const SITEMAP_DB_PAGE_SIZE = 1000
/** Columns on public.sitemap_clinics. The read uses id, slug, and city only. */
export const SITEMAP_VIEW_COLUMNS = ['id', 'slug', 'city', 'glow_score'] as const
export const SITEMAP_SELECT = 'id, slug, city'

export type SitemapRow = {
  id: string | number
  slug: string
  city: string
}

export type SitemapPageResult = {
  data: SitemapRow[] | null
  error: { message: string } | null
}

export type SitemapRangeClient = {
  from(table: string): {
    select(columns: string): {
      order(column: string, options?: { ascending?: boolean }): {
        range(from: number, to: number): PromiseLike<SitemapPageResult>
      }
    }
  }
}

export class SitemapDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SitemapDataError'
  }
}

export function citySlug(city: string): string {
  return city.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}

/**
 * Read the deduped sitemap view in inclusive PostgREST pages.
 * Order is id so each range continues where the previous page stopped.
 * A failed page throws and does not return the rows already collected.
 */
export async function loadSitemapRows(
  client: SitemapRangeClient,
  pageSize = SITEMAP_DB_PAGE_SIZE,
): Promise<SitemapRow[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new SitemapDataError('Invalid sitemap page size')
  }

  const rows: SitemapRow[] = []
  let from = 0

  for (;;) {
    const { data, error } = await client
      .from('sitemap_clinics')
      .select(SITEMAP_SELECT)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw new SitemapDataError(error.message)
    const page = data ?? []
    for (const row of page) {
      if (!row.slug || !row.city) continue
      rows.push(row)
    }
    if (page.length < pageSize) break
    from += pageSize
  }

  return rows
}
