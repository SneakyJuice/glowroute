import { unstable_cache } from 'next/cache'
import { getSupabaseReadClient } from '@/lib/supabase'
import { createSnapshotGuard } from '@/lib/snapshot-guard'
import {
  SITEMAP_DB_PAGE_SIZE,
  SitemapDataError,
  citySlug,
  loadSitemapRows,
  type SitemapRow,
} from '@/lib/sitemap-paging'

export { SITEMAP_DB_PAGE_SIZE, SitemapDataError, citySlug }
export type { SitemapRow }
export type SitemapClinic = { slug: string; city: string }

/** Use the same publication checks and deterministic snapshot as the rendered directory. */
export const SITEMAP_CHUNK_SIZE = 5000
export const SITEMAP_REVALIDATE_SECONDS = 86400
const SITEMAP_BREAKER_OPEN_MS = 60_000

const loadCachedSitemapRows = unstable_cache(
  async () => {
    const supabase = getSupabaseReadClient()
    if (!supabase) throw new SitemapDataError('Supabase sitemap client not configured')
    return loadSitemapRows(supabase)
  },
  ['glowroute-sitemap-clinics-v1'],
  { revalidate: SITEMAP_REVALIDATE_SECONDS, tags: ['glowroute-sitemap'] },
)

const sitemapGuard = createSnapshotGuard<SitemapRow[]>({
  openMs: SITEMAP_BREAKER_OPEN_MS,
  freshMs: SITEMAP_REVALIDATE_SECONDS * 1000,
  isUsable: (rows) => rows.length > 0,
  load: () => loadCachedSitemapRows(),
  onServeStale: () => {
    console.warn('[sitemap] Serving the last good sitemap rows after a fetch error')
  },
})

async function publishedRows(): Promise<SitemapRow[]> {
  return sitemapGuard.get()
}

export function sitemapCitySlugs(rows: readonly { city: string }[]): string[] {
  return Array.from(new Set(rows.map((row) => citySlug(row.city)))).filter(Boolean).sort()
}

export async function fetchSitemapClinicCount(): Promise<number> {
  return (await publishedRows()).length
}

export async function fetchSitemapClinicChunk(chunkIndex: number): Promise<SitemapClinic[]> {
  if (!Number.isSafeInteger(chunkIndex) || chunkIndex < 0) throw new SitemapDataError('Invalid sitemap chunk')
  return (await publishedRows())
    .slice(chunkIndex * SITEMAP_CHUNK_SIZE, (chunkIndex + 1) * SITEMAP_CHUNK_SIZE)
    .map(({ slug, city }) => ({ slug, city }))
}

export async function fetchSitemapCities(): Promise<string[]> {
  return sitemapCitySlugs(await publishedRows())
}
