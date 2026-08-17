import { getSupabaseAdmin } from '@/lib/supabase'

/** Google allows 50k URLs per file; stay well under for payload size. */
export const SITEMAP_CHUNK_SIZE = 5000

export type SitemapClinic = {
  slug: string
  city: string
}

export function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function normalizeSlug(slug: string): string {
  return (slug || '').replace(/^\/+/, '')
}

/** Count only. Used by the sitemap index so /sitemap.xml never loads clinic rows. */
export async function fetchSitemapClinicCount(): Promise<number> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return 0

  const { count, error } = await supabase
    .from('clinics')
    .select('id', { count: 'exact', head: true })
    .in('visibility', ['visible'])

  if (error) {
    console.error('[sitemap] count failed:', error.message)
    return 0
  }
  return count ?? 0
}

/** One chunk of clinic URLs. Only slug + city — never select(*). */
export async function fetchSitemapClinicChunk(chunkIndex: number): Promise<SitemapClinic[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const from = chunkIndex * SITEMAP_CHUNK_SIZE
  const to = from + SITEMAP_CHUNK_SIZE - 1
  const { data, error } = await supabase
    .from('clinics')
    .select('slug, city')
    .in('visibility', ['visible'])
    .order('glow_score', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[sitemap] chunk fetch failed:', error.message)
    return []
  }

  const seen = new Set<string>()
  const rows: SitemapClinic[] = []
  for (const row of data ?? []) {
    const slug = normalizeSlug(row.slug)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    rows.push({ slug, city: row.city || '' })
  }
  return rows
}

/** Unique city slugs for /clinics/{city} pages. City names only. */
export async function fetchSitemapCities(): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const BATCH = 1000
  const cities = new Set<string>()
  let page = 0

  while (true) {
    const from = page * BATCH
    const to = from + BATCH - 1
    const { data, error } = await supabase
      .from('clinics')
      .select('city')
      .in('visibility', ['visible'])
      .order('city', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('[sitemap] cities fetch failed:', error.message)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      if (row.city) cities.add(citySlug(row.city))
    }
    if (data.length < BATCH) break
    page++
  }

  return Array.from(cities)
}

export async function fetchTopClaimSlugs(limit = 200): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('clinics')
    .select('slug')
    .in('visibility', ['visible'])
    .order('glow_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[sitemap] claim slugs failed:', error.message)
    return []
  }

  return (data ?? [])
    .map((row) => normalizeSlug(row.slug))
    .filter(Boolean)
}
