import { Clinic } from '@/types/clinic'
import { getSupabaseReadClient as getSupabaseAdmin } from '@/lib/supabase'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createSnapshotGuard } from '@/lib/snapshot-guard'
import { aggregateLiveCityHubs, citySlugToDisplay, type LiveCityHub } from '@/lib/seo-page-overrides'
import { hasAddressStateConflict, listingDescription, publicImageUrl } from '@/lib/listing-integrity'
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

/** Reject damaged text without treating legitimate non-Latin writing as corruption. */
function isGarbledDescription(desc: string): boolean {
  if (!desc || desc.length < 5) return false
  let hasControl = false
  for (let i = 0; i < desc.length; i++) {
    const code = desc.charCodeAt(i)
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) hasControl = true
  }
  const hasReplacement = desc.includes('\ufffd')
  return hasReplacement || hasControl
}

/** Generate a clean fallback description from structured data */
function generateDescription(clinic: Clinic): string {
  const treatments = [
    ...(clinic.treatments || []),
    ...(clinic.specialtyTreatments || []),
  ]
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 4)

  const base = `${clinic.name} is listed in the GlowRoute directory for ${clinic.city}${clinic.state ? ", " + clinic.state : ""}.`
  const services = treatments.length
    ? ` Listed services: ${treatments.join(', ')}.`
    : ''
  const booking = clinic.bookingUrl ? ' Online booking available.' : ''
  return base + services + booking
}

/** Clean a clinic record — strip garbled descriptions, normalize nulls */
export function clean(clinic: Clinic): Clinic {
  return {
    ...clinic,
    imageUrl: publicImageUrl(clinic.imageUrl),
    heroImageUrl: publicImageUrl(clinic.heroImageUrl),
    logo: publicImageUrl(clinic.logo),
    description: listingDescription(clinic.description) ||
      `View contact and location details for ${clinic.name} in ${clinic.city}${clinic.state ? ', ' + clinic.state : ''}.`,
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
    state: row.state || undefined,
    neighborhood: undefined,
    distance: undefined,
    // Legacy jobs write completeness scores into glow_score. It cannot prove Google stars.
    googleRating: 0,
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
    priceTier: undefined,
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
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
  }
}

/**
 * Fetch visible clinics for directory pages.
 * One shared cached list: narrow columns, keyset pages, glow_score then id.
 */

const MAX_DIRECTORY_PAGES = 200
/** Single in-process snapshot. The cap stops the memo from growing with each page. */
const DIRECTORY_MEMO_MAX_CLINICS = MAX_DIRECTORY_PAGES * DIRECTORY_PAGE_SIZE
/** After a database failure, skip the pool for one minute. */
export const DIRECTORY_BREAKER_OPEN_MS = 60_000
const RELATED_CLINIC_LIMIT = 50
const NEARBY_CLINIC_LIMIT = 4

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
 * Stable page cache. The key does not include a timestamp, so an hourly
 * revalidation refreshes the same entries instead of orphaning them.
 * Pages stay under the Next.js 2MB data-cache entry limit.
 */
const loadCachedDirectoryPage = unstable_cache(
  async (cursorKey: string) => fetchDirectoryPage(decodeDirectoryCursor(cursorKey)),
  ['glowroute-visible-clinics-v7'],
  { revalidate: DIRECTORY_REVALIDATE_SECONDS, tags: ['glowroute-directory'] },
)

async function loadVisibleClinics(): Promise<Clinic[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new Error('[supabase-clinics] Supabase directory client not configured')
  }

  const pages = await collectDirectoryPages(
    (cursorKey) => loadCachedDirectoryPage(cursorKey),
    MAX_DIRECTORY_PAGES,
    (maxPages) => {
      console.warn(
        `[supabase-clinics] Stopped after ${maxPages} directory pages; the visible clinic list may be incomplete`,
      )
    },
  )

  const unique = dedupeClinicsBySlug(pages).filter((clinic) => !hasAddressStateConflict(clinic))
  unique.sort((a, b) =>
    compareDirectoryOrder(
      { glowScore: a.glowScore ?? null, id: a.id },
      { glowScore: b.glowScore ?? null, id: b.id },
    ),
  )
  if (unique.length > DIRECTORY_MEMO_MAX_CLINICS) {
    console.warn(
      `[supabase-clinics] Skipping the in-memory directory memo; ${unique.length} clinics exceeds ${DIRECTORY_MEMO_MAX_CLINICS}`,
    )
  }
  console.log(`[supabase-clinics] Returning ${unique.length} clinics`)
  return unique
}

const directoryGuard = createSnapshotGuard<Clinic[]>({
  openMs: DIRECTORY_BREAKER_OPEN_MS,
  freshMs: DIRECTORY_REVALIDATE_SECONDS * 1000,
  isUsable: (clinics) => clinics.length > 0 && clinics.length <= DIRECTORY_MEMO_MAX_CLINICS,
  load: loadVisibleClinics,
  onServeStale: () => {
    console.warn('[supabase-clinics] Serving the last good directory list after a fetch error')
  },
})

function failFastIfBreakerOpen(): void {
  if (!directoryGuard.isOpen()) return
  const error = directoryGuard.lastError()
  if (error instanceof Error) throw error
  throw new Error('[supabase-clinics] Circuit breaker open')
}

function directorySnapshotIfOpen(): Clinic[] | null {
  if (!directoryGuard.isOpen()) return null
  const snapshot = directoryGuard.snapshot()
  if (snapshot && snapshot.length > 0) return snapshot
  failFastIfBreakerOpen()
  return null
}

export const fetchAllClinicsFromSupabase = cache(async (): Promise<Clinic[]> => {
  try {
    return await directoryGuard.get()
  } catch (err) {
    console.error('[supabase-clinics] Unexpected error:', err)
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
function throwDirectoryReadError(error: { message: string }, label: string): never {
  const wrapped = new Error(`[supabase-clinics] ${label}: ${error.message}`)
  directoryGuard.trip(wrapped)
  throw wrapped
}

function requireDirectoryClient() {
  failFastIfBreakerOpen()
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throwDirectoryReadError({ message: 'Supabase directory client not configured' }, 'Error fetching clinic')
  }
  return supabase
}

/**
 * One city, bounded. Profiles use this instead of the national directory.
 * A database error throws so ISR can keep the last good page.
 */
async function selectCityClinics(cityName: string, treatment: string | null, limit: number, excludeSlug?: string): Promise<Clinic[]> {
  const supabase = requireDirectoryClient()
  let query = supabase
    .from('clinics')
    .select(DIRECTORY_SELECT)
    .eq('visibility', 'visible')
    .ilike('city', cityName)
  if (treatment) query = query.contains('services', [treatment])
  if (excludeSlug) query = query.neq('slug', excludeSlug)
  const { data, error } = await query
    .order('glow_score', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(limit)

  if (error) throwDirectoryReadError(error, 'Error fetching city clinics')
  return (data ?? [])
    .filter((row) => !hasAddressStateConflict(row as unknown as { address?: string; state?: string }))
    .map((row) => clean(mapSupabaseRow(row)))
}

function relatedFromSnapshot(clinics: readonly Clinic[], citySlug: string, treatment: string, limit: number): Clinic[] {
  const cityClinics = filterClinicsForCitySlug(clinics, citySlug)
  const matched = cityClinics.filter((clinic) =>
    (clinic.services ?? []).includes(treatment) || (clinic.treatments ?? []).includes(treatment),
  )
  return (matched.length > 0 ? matched : cityClinics).slice(0, limit)
}

/** Treatment and related cards for one city. Does not load the national directory. */
export async function fetchRelatedClinics(citySlug: string, treatment: string, limit = RELATED_CLINIC_LIMIT): Promise<Clinic[]> {
  const cached = directorySnapshotIfOpen()
  if (cached) return relatedFromSnapshot(cached, citySlug, treatment, limit)
  try {
    const displayName = citySlugToDisplay(citySlug)
    const matched = await selectCityClinics(displayName, treatment, limit)
    if (matched.length > 0) return matched
    return await selectCityClinics(displayName, null, limit)
  } catch (error) {
    const snapshot = directoryGuard.snapshot()
    if (snapshot && snapshot.length > 0) return relatedFromSnapshot(snapshot, citySlug, treatment, limit)
    throw error
  }
}

/** A few other visible clinics in the same city, for a profile sidebar. */
export async function fetchNearbyClinics(city: string, slug: string, limit = NEARBY_CLINIC_LIMIT): Promise<Clinic[]> {
  const fromSnapshot = () =>
    (directoryGuard.snapshot() ?? [])
      .filter((clinic) => clinic.city === city && clinic.slug !== slug)
      .slice(0, limit)

  if (directoryGuard.isOpen()) return fromSnapshot()

  try {
    return await selectCityClinics(city, null, limit, slug)
  } catch (error) {
    // Recommendations are optional. Do not fail a profile that loaded successfully.
    console.warn('[supabase-clinics] Nearby clinics unavailable:', error)
    return fromSnapshot()
  }
}

/**
 * Resolve a current slug or a historical alias to its visible canonical clinic.
 * Uses the directory columns, not select=*.
 * Returns null only when the slug is empty or no row exists.
 * A database error throws so ISR keeps the last good page instead of storing a 404.
 */
export const fetchClinicByExactSlug = cache(async (slug: string): Promise<Clinic | null> => {
  if (!slug) return null
  const supabase = requireDirectoryClient()

  const { data, error } = await supabase
    .from('clinics')
    .select(DIRECTORY_SELECT)
    .eq('slug', slug)
    .eq('visibility', 'visible')
    .order('glow_score', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(1)

  if (error) throwDirectoryReadError(error, 'Error fetching clinic')
  if (data?.[0] && !hasAddressStateConflict(data[0] as unknown as { address?: string; state?: string })) {
    return clean(mapSupabaseRow(data[0]))
  }

  // Suppressed duplicates keep their old URLs. Returning the canonical record
  // lets the profile route issue its existing permanent redirect to that record.
  const { data: alias, error: aliasError } = await supabase
    .from('clinic_aliases')
    .select('canonical_clinic_id')
    .eq('alias_slug', slug)
    .maybeSingle()

  if (aliasError) throwDirectoryReadError(aliasError, 'Error resolving clinic alias')
  if (!alias) return null

  const { data: canonical, error: canonicalError } = await supabase
    .from('clinics')
    .select(DIRECTORY_SELECT)
    .eq('id', alias.canonical_clinic_id)
    .eq('visibility', 'visible')
    .maybeSingle()

  if (canonicalError) throwDirectoryReadError(canonicalError, 'Error fetching canonical clinic')
  if (!canonical || hasAddressStateConflict(canonical as unknown as { address?: string; state?: string })) return null
  return clean(mapSupabaseRow(canonical))
})

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
