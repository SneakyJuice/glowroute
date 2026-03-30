import { Clinic } from '@/types/clinic'
import { getSupabaseAdmin } from '@/lib/supabase'

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

  const base = `${clinic.name} is a med spa and aesthetic wellness clinic in ${clinic.city}, FL.`
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
 * Note: googleRating and googleReviewCount are not in Supabase schema,
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
    googleRating: row.glow_score ?? 0,         // populated after GMB migration + enrichment
    googleReviewCount: row.review_count ?? 0,  // populated after GMB migration + enrichment
    treatments: Array.isArray(row.services) ? row.services : [],
    specialtyTreatments: [],
    verified: row.is_verified || false,
    featured: row.is_featured || false,
    isNew: false,
    priceTier: '$$', // TODO: map claim_tier if possible
    availability: undefined,
    imageUrl: row.hero_image_url || undefined,
    images: row.hero_image_url ? [row.hero_image_url] : [],
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
 * Fetch all clinics from Supabase, map to Clinic[], clean, deduplicate.
 * This function is intended for server-side use only.
 */
export async function fetchAllClinicsFromSupabase(): Promise<Clinic[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    console.warn('[supabase-clinics] Supabase admin client not available, returning empty array')
    return []
  }

  const BATCH_SIZE = 1000
  let allRows: any[] = []
  let page = 0
  let hasMore = true

  try {
    while (hasMore) {
      const from = page * BATCH_SIZE
      const to = from + BATCH_SIZE - 1
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .range(from, to)
      
      if (error) {
        console.error('[supabase-clinics] Error fetching clinics:', error.message)
        break
      }
      
      if (data && data.length > 0) {
        allRows = allRows.concat(data)
        console.log(`[supabase-clinics] Fetched ${data.length} clinics (total: ${allRows.length})`)
      }
      
      if (!data || data.length < BATCH_SIZE) {
        hasMore = false
      }
      page++
    }

    // Map rows to Clinic
    const mapped = allRows.map(mapSupabaseRow)
    
    // Deduplicate by slug
    const seen = new Set<string>()
    const deduped = mapped.filter(c => {
      if (!c.slug || seen.has(c.slug)) return false
      seen.add(c.slug)
      return true
    })
    
    // Clean each record
    const cleaned = deduped.map(clean)
    
    console.log(`[supabase-clinics] Returning ${cleaned.length} clinics`)
    return cleaned
  } catch (err) {
    console.error('[supabase-clinics] Unexpected error:', err)
    return []
  }
}

/**
 * Featured clinic: first clinic with featured flag, or first clinic.
 */
export async function fetchFeaturedClinic(): Promise<Clinic | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('is_featured', true)
    .limit(1)
  
  if (error || !data || data.length === 0) {
    // Fallback to first clinic
    const { data: first } = await supabase
      .from('clinics')
      .select('*')
      .limit(1)
    if (first && first.length > 0) {
      return clean(mapSupabaseRow(first[0]))
    }
    return null
  }
  
  return clean(mapSupabaseRow(data[0]))
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