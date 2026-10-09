import { Clinic } from '@/types/clinic'
import { getSupabaseAdmin } from '@/lib/supabase'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { aggregateLiveCityHubs, type LiveCityHub } from '@/lib/seo-page-overrides'
import {
  DIRECTORY_PAGE_SIZE,
  DIRECTORY_REVALIDATE_SECONDS,
  DIRECTORY_SELECT,
  compareDirectoryOrder,
  collectDirectoryPages,
  cursorFromDirectoryRow,
  decodeDirectoryCursor,
  dedupeClinicsBySlug,
  directoryKeysetFilter,
  encodeDirectoryCursor,
  filterClinicsForCitySlug,
  type DirectoryCursor,
} from '@/lib/clinic-directory'

/** Returns true if a description contains garbled/binary/non-Latin encoded text */
function isGarbledDescription(desc: string): boolean {
  if (!desc || desc.length < 5) return false
  // Count high-unicode chars (>1000 codepoint = likely foreign script / corruption)
  let highUnicode = 0
  let hasControl = false
  for (let i = 0; i < desc.length; i++) {
    const code = desc.charCodeAt(i)
    if (code > 1000) highUnicode++
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) hasControl = true
  }
  const hasReplacement = desc.includes('\ufffd')
  return highUnicode > 3 || hasReplacement || hasControl
}

/** Generate a clean fallback description from structured data */
function generateDescription(clinic: Clinic): string {
  const treatments = [
    ...(clinic.treatments || []),
    ...(clinic.specialtyTreatments || []),
  ]
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 4)

  const base = `${clinic.name} is a med spa and aesthetic wellness clinic in ${clinic.city}${clinic.state ? ", " + clinic.state : ""}.`
  const services = treatments.length
    ? ` Services include ${treatments.join(', ')}.`
    : ''
  const booking = clinic.bookingUrl ? ' Online booking available.' : ''
  return base + services + booking
}

/** Clean a clinic record — strip garbled descriptions, normalize nulls */
export function clean(clinic: Clinic): Clinic {
  const descGarbled =
    clinic.description && isGarbledDescription(clinic.description)

  return {
    ...clinic,
    description: descGarbled
      ? generateDescription(clinic)
      : clinic.description || generateDescription(clinic),
  }
}

/**
 * Map a Supabase clinic row to the Clinic interface.
 * Note: googleRating maps from glow_score; googleReviewCount maps from review_count column (added 2026-03-31).
 * so we provide defaults. Treatments are mapped from services array.
 */
export function mapSupabaseRow(row: any): Clinic {
  return {
    id: row.id,
    slug: (row.slug || '').replace(/^\/+/, ''), // strip leading slashes that break Next.js routing
    name: row.name,
    city: row.city,
    state: row.state || 'FL',
    neighborhood: undefined,
    distance: undefined,
    googleRating: row.glow_score ?? 0,         // GMB star rating (0.0-5.0)
    glowScore: row.glow_score ?? 0,            // Quality tier (0-5)
    dataQualityScore: row.data_quality_score ?? 0, // Completeness score (0-100)
    googleReviewCount: row.review_count ?? 0,  // Real GMB review count — backfilled 2026-03-31
    goals: row.goals ?? [],                    // Health goal tags — backfilled 2026-03-31
    services: Array.isArray(row.services) ? row.services : [],  // canonical service slugs
    visibility: row.visibility ?? 'visible',   // Visibility control — added 2026-03-31
    treatments: Array.isArray(row.services) ? row.services : [],
    specialtyTreatments: [],
    verified: row.is_verified || false,
    isVerified: row.is_verified || false,
    isClaimed: row.is_claimed || false,
    featured: row.is_featured || false,
    heroImageUrl: row.hero_image_url || undefined, // alias for imageUrl — kept for backward compat
    isNew: false,
    priceTier: '$$', // TODO: map claim_tier if possible
    availability: undefined,
    imageUrl: row.hero_image_url || undefined, // single canonical image field
    images: [], // images[] is no longer a 1-element echo of imageUrl; populate only when multi-image gallery exists
    logo: row.logo_url || undefined,
    description: row.description || undefined,
    address: row.address || undefined,
    phone: row.phone || undefined,
    website: row.website || undefined,
    bookingUrl: undefined,
    instagram: row.instagram_handle || undefined,
    instagramHandle: row.instagram_handle || undefined,
    tiktokHandle: undefined,
    icalUrl: undefined,
    mapsUrl: undefined,
    brandValues: [],
    lat: row.lat || undefined,
    lng: row.lng || undefined,
  }
}

/**
 * Fetch visible clinics for directory pages.
 * One shared cached list: narrow columns, keyset pages, glow_score then id.
 */

const DIRECTORY_CACHE_TTL_MS = DIRECTORY_REVALIDATE_SECONDS * 1000
const MAX_DIRECTORY_PAGES = 200
/** Single in-process snapshot. The cap stops the memo from growing with each page. */
const DIRECTORY_MEMO_MAX_CLINICS = MAX_DIRECTORY_PAGES * DIRECTORY_PAGE_SIZE
/**
 * Page entries outlive the version key. A page is not refreshed on its own
 * while that version is still the one being served.
 */
const DIRECTORY_PAGE_REVALIDATE_SECONDS = DIRECTORY_REVALIDATE_SECONDS * 2

type DirectoryMemo = {
  version: string
  at: number
  clinics: Clinic[]
}

let directoryMemo: DirectoryMemo | null = null

function rememberDirectory(version: string, clinics: Clinic[]) {
  if (clinics.length === 0) return
  if (clinics.length > DIRECTORY_MEMO_MAX_CLINICS) {
    console.warn(
      `[supabase-clinics] Skipping the in-memory directory memo; ${clinics.length} clinics exceeds ${DIRECTORY_MEMO_MAX_CLINICS}`,
    )
    return
  }
  directoryMemo = { version, at: Date.now(), clinics }
}

type DirectoryPage = {
  clinics: Clinic[]
  nextCursorKey: string
  done: boolean
}

async function fetchDirectoryPage(cursor: DirectoryCursor | null): Promise<DirectoryPage> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new Error('[supabase-clinics] Supabase admin client not available')
  }

  let query = supabase
    .from('clinics')
    .select(DIRECTORY_SELECT)
    .in('visibility', ['visible'])
    .order('glow_score', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(DIRECTORY_PAGE_SIZE)

  const keyset = directoryKeysetFilter(cursor)
  if (keyset) query = query.or(keyset)

  const { data, error } = await query
  if (error) {
    throw new Error(`[supabase-clinics] Error fetching clinics: ${error.message}`)
  }

  const rows = (data ?? []) as Array<{
    glow_score?: number | string | null
    id?: string | number | null
  }>
  const last = rows[rows.length - 1]
  return {
    clinics: rows.map((row) => clean(mapSupabaseRow(row))),
    nextCursorKey: last ? encodeDirectoryCursor(cursorFromDirectoryRow(last)) : '',
    done: rows.length < DIRECTORY_PAGE_SIZE,
  }
}

/**
 * One version key for the whole directory snapshot.
 * Each page key includes that version, and page entries outlive it, so pages
 * from two versions are never combined when a clinic's glow_score changes.
 * Pages stay under the Next.js 2MB data-cache entry limit.
 */
const loadDirectoryVersion = unstable_cache(
  async () => ({ version: String(Date.now()) }),
  ['glowroute-visible-clinics-version-v2'],
  { revalidate: DIRECTORY_REVALIDATE_SECONDS },
)

const loadVersionedDirectoryPage = unstable_cache(
  async (version: string, cursorKey: string) => {
    if (!version) {
      throw new Error('[supabase-clinics] Directory cache version is missing')
    }
    return fetchDirectoryPage(decodeDirectoryCursor(cursorKey))
  },
  ['glowroute-visible-clinics-page-v2'],
  { revalidate: DIRECTORY_PAGE_REVALIDATE_SECONDS },
)

async function loadVisibleClinics(version: string): Promise<Clinic[]> {
  const pages = await collectDirectoryPages(
    (cursorKey) => loadVersionedDirectoryPage(version, cursorKey),
    MAX_DIRECTORY_PAGES,
    (maxPages) => {
      console.warn(
        `[supabase-clinics] Stopped after ${maxPages} directory pages; the visible clinic list may be incomplete`,
      )
    },
  )

  const unique = dedupeClinicsBySlug(pages)
  unique.sort((a, b) =>
    compareDirectoryOrder(
      { glowScore: a.glowScore ?? null, id: a.id },
      { glowScore: b.glowScore ?? null, id: b.id },
    ),
  )
  console.log(`[supabase-clinics] Returning ${unique.length} clinics`)
  return unique
}

export const fetchAllClinicsFromSupabase = cache(async (): Promise<Clinic[]> => {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    console.warn('[supabase-clinics] Supabase admin client not available, returning empty array')
    return []
  }

  try {
    const { version } = await loadDirectoryVersion()
    if (
      directoryMemo &&
      directoryMemo.version === version &&
      directoryMemo.clinics.length <= DIRECTORY_MEMO_MAX_CLINICS &&
      Date.now() - directoryMemo.at < DIRECTORY_CACHE_TTL_MS
    ) {
      return directoryMemo.clinics
    }

    const clinics = await loadVisibleClinics(version)
    rememberDirectory(version, clinics)
    return clinics
  } catch (err) {
    console.error('[supabase-clinics] Unexpected error:', err)
    if (directoryMemo && directoryMemo.clinics.length > 0) {
      console.warn('[supabase-clinics] Serving the last good directory list after a fetch error')
      return directoryMemo.clinics
    }
    throw err
  }
})

/**
 * Distinct live /clinics/{city} hubs from the cached visible directory.
 */
export const fetchLiveCityHubs = cache(async (): Promise<LiveCityHub[]> => {
  const clinics = await fetchAllClinicsFromSupabase()
  const hubs = aggregateLiveCityHubs(
    clinics.map((clinic) => ({
      city: clinic.city,
      state: clinic.state,
      lat: clinic.lat,
      lng: clinic.lng,
    })),
  )
  console.log(`[supabase-clinics] fetchLiveCityHubs: ${hubs.length} live city hubs`)
  return hubs
})

/**
 * Clinics for a city slug, taken from the cached visible directory.
 * Exact display-name match first, then a case-insensitive fallback.
 */
export const fetchClinicsByCity = cache(async (citySlug: string): Promise<Clinic[]> => {
  const clinics = await fetchAllClinicsFromSupabase()
  const matched = filterClinicsForCitySlug(clinics, citySlug)
  console.log(`[supabase-clinics] fetchClinicsByCity: ${matched.length} rows for ${citySlug}`)
  return matched
})

/**
 * Featured clinic: first clinic with featured flag, or first clinic.
 */
/** Single-row slug lookup. Uses the directory columns, not select=*. */
export async function fetchClinicByExactSlug(slug: string): Promise<Clinic | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase || !slug) return null

  const { data, error } = await supabase
    .from('clinics')
    .select(DIRECTORY_SELECT)
    .eq('slug', slug)
    .order('id', { ascending: true })
    .limit(1)

  if (error || !data || data.length === 0) return null
  return clean(mapSupabaseRow(data[0]))
}

/** Featured clinic from the cached visible directory, else the first row in directory order. */
export async function fetchFeaturedClinic(): Promise<Clinic | null> {
  const clinics = await fetchAllClinicsFromSupabase()
  return clinics.find((clinic) => clinic.featured) ?? clinics[0] ?? null
}

/**
 * Standard clinics: all clinics except the featured one.
 */
export async function fetchStandardClinics(): Promise<Clinic[]> {
  const all = await fetchAllClinicsFromSupabase()
  const featured = await fetchFeaturedClinic()
  if (!featured) return all
  return all.filter(c => c.id !== featured.id)
}