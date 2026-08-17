import { getSupabaseAdmin } from '@/lib/supabase'

/** Google allows 50k URLs per file; stay well under for payload size. */
export const SITEMAP_CHUNK_SIZE = 5000

export type SitemapClinic = {
  id: string | number
  slug: string
  city: string
}

export class SitemapDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SitemapDataError'
  }
}

export function citySlug(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

function requireSupabase() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new SitemapDataError('Supabase is not configured for sitemap generation')
  }
  return supabase
}

/**
 * Count the deduplicated sitemap view. The index and chunk routes are both
 * dynamic, so this count cannot drift from the routes that actually exist.
 */
export async function fetchSitemapClinicCount(): Promise<number> {
  const supabase = requireSupabase()
  const { count, error } = await supabase
    .from('sitemap_clinics')
    .select('id', { count: 'exact', head: true })

  if (error) throw new SitemapDataError(`Sitemap count failed: ${error.message}`)
  return count ?? 0
}

/** One deterministic, globally deduplicated chunk: only id + slug + city. */
export async function fetchSitemapClinicChunk(chunkIndex: number): Promise<SitemapClinic[]> {
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    throw new SitemapDataError(`Invalid sitemap chunk: ${chunkIndex}`)
  }

  const supabase = requireSupabase()
  const from = chunkIndex * SITEMAP_CHUNK_SIZE
  const to = from + SITEMAP_CHUNK_SIZE - 1
  const { data, error } = await supabase
    .from('sitemap_clinics')
    .select('id, slug, city')
    // The id tie-breaker makes range pagination stable when scores are equal.
    .order('glow_score', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw new SitemapDataError(`Sitemap chunk failed: ${error.message}`)

  return (data ?? []).filter((row) => row.slug && row.city).map((row) => ({
    id: row.id,
    slug: String(row.slug).replace(/^\/+/, ''),
    city: String(row.city),
  }))
}

/** Unique city slugs for /clinics/{city} pages. */
export async function fetchSitemapCities(): Promise<string[]> {
  const supabase = requireSupabase()
  const BATCH = 1000
  const cities = new Set<string>()
  let page = 0

  while (true) {
    const from = page * BATCH
    const to = from + BATCH - 1
    const { data, error } = await supabase
      .from('sitemap_clinics')
      .select('id, city')
      .order('city', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)

    if (error) throw new SitemapDataError(`Sitemap cities failed: ${error.message}`)
    if (!data || data.length === 0) break

    for (const row of data) {
      if (row.city) cities.add(citySlug(String(row.city)))
    }
    if (data.length < BATCH) break
    page++
  }

  return Array.from(cities).filter(Boolean)
}

export async function fetchTopClaimSlugs(limit = 200): Promise<string[]> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('sitemap_clinics')
    .select('slug')
    .order('glow_score', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(limit)

  if (error) throw new SitemapDataError(`Sitemap claim pages failed: ${error.message}`)
  return Array.from(new Set((data ?? []).map((row) => String(row.slug).replace(/^\/+/, '')).filter(Boolean)))
}
