/** Locked GlowRoute directory SEO overrides. Targeted slugs only. */

export const GUIDE_YEAR = 2026
export const NEARBY_HUB_LIMIT = 10
export const NEARBY_METRO_MILES = 75
export const NEARBY_MAX_MILES = 100

function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthMiles = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return earthMiles * 2 * Math.asin(Math.sqrt(a))
}

/** Extra static paths that must appear in sitemap chunk 0. No /claim/{slug}. */
export const SITEMAP0_LOCKED_PATHS = ['/guides/botox-cost'] as const

export const MIAMI_NEARBY_HUBS = [
  'miami-beach',
  'coral-gables',
  'aventura',
  'doral',
  'fort-lauderdale',
  'hollywood',
  'boca-raton',
  'kendall',
  'hialeah',
  'pembroke-pines',
] as const

export const MIAMI_VIEW_ALL_HREF = '/clinics?city=Miami'

export const MIAMI_CITY_METADATA = {
  title: 'Best MedSpas in Miami, FL — GlowRoute',
  description:
    'Find medical spas and aesthetic clinics in Miami, FL. Compare Botox, HydraFacial, laser, and more on GlowRoute.',
  keywords: [
    'Miami medspa',
    'Miami medical spa',
    'Botox Miami',
    'HydraFacial Miami',
    'aesthetic clinic Miami',
  ],
  viewAllHref: MIAMI_VIEW_ALL_HREF,
  canonicalPath: '/clinics/miami',
  nearbyHubs: MIAMI_NEARBY_HUBS,
} as const

export type CitySeoOverride = {
  title: string
  description: string
  keywords: readonly string[]
  viewAllHref: string
  canonicalPath: string
  nearbyHubs: readonly string[]
}

export type ClinicSeoOverride = {
  title: string
  description: string
  keywords: readonly string[]
  backHref: string
  backLabel: string
  canonicalPath: string
  /** Hide invented 430+ / Verified promo chrome on this clinic route. */
  suppressRankingPromo?: boolean
}

export type ClaimSeoOverride = {
  title: string
  description: string
  keywords: readonly string[]
  backHref: string
  backLabel: string
  canonicalPath: string
}

export const CLINIC_SLUG_OVERRIDES: Record<string, ClinicSeoOverride> = {
  'miami/miami-plastic-surgery-miami': {
    title: 'Miami Plastic Surgery | GlowRoute',
    description:
      'Miami Plastic Surgery in Miami, FL — plastic surgery, medical spa, Botox, HydraFacial, and CoolSculpting. Compare and claim on GlowRoute.',
    keywords: [
      'Miami Plastic Surgery',
      'plastic surgery Miami',
      'Botox Miami',
      'HydraFacial Miami',
      'CoolSculpting Miami',
      'medical spa Miami',
    ],
    backHref: '/clinics/miami',
    backLabel: 'Back to Miami clinics',
    canonicalPath: '/clinics/miami/miami-plastic-surgery-miami',
    suppressRankingPromo: true,
  },
}

export const CLAIM_SLUG_OVERRIDES: Record<string, ClaimSeoOverride> = {
  'skinlocal-dadeland-miami': {
    title: 'Claim SkinLocal Dadeland — GlowRoute',
    description:
      'Claim the GlowRoute listing for SkinLocal Dadeland in Miami, FL. Manage your Dadeland medspa profile and attract more patients.',
    keywords: [
      'SkinLocal Dadeland',
      'SkinLocal Miami',
      'Dadeland medspa',
      'Botox Miami',
      'HydraFacial Miami',
      'claim listing Miami',
    ],
    backHref: '/clinics/miami/skinlocal-dadeland-miami',
    backLabel: 'Back to SkinLocal Dadeland',
    canonicalPath: '/claim/skinlocal-dadeland-miami',
  },
}

export const QUIZ_METADATA = {
  title: 'GlowRoute Treatment Quiz',
  description: 'A short quiz to explore GlowRoute treatment options.',
  keywords: [] as string[],
  canonicalPath: '/quiz',
} as const

/** Locked `/claim` hub metadata. No clinic counts or verified-network language. */
export const CLAIM_HUB_METADATA = {
  title: 'Claim Your GlowRoute Listing — GlowRoute',
  description:
    'Claim and manage your medspa or aesthetic clinic listing on GlowRoute. Update your profile and reach patients searching for care near you.',
  keywords: [] as string[],
  canonicalPath: '/claim',
} as const

function stripFlSuffix(slug: string): string {
  return slug.replace(/-fl$/, '')
}

/** Locked URLs drop `-fl`; local/static rows sometimes keep it. Try both. */
export function clinicSlugLookupCandidates(slug: string): string[] {
  const stripped = stripFlSuffix(slug)
  const withFl = stripped.endsWith('-fl') ? stripped : `${stripped}-fl`
  return Array.from(new Set([slug, stripped, withFl].filter(Boolean)))
}

export type LiveCityHub = {
  slug: string
  state?: string
  lat?: number
  lng?: number
}

export type CityHubSeoContext = {
  stateAbbr?: string
  nearbyHubs?: readonly string[]
}

export function toCitySlug(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

export function cityHubKeywords(displayCity: string): string[] {
  return [
    `${displayCity} medspa`,
    `${displayCity} medical spa`,
    `Botox ${displayCity}`,
    `HydraFacial ${displayCity}`,
    `aesthetic clinic ${displayCity}`,
  ]
}

export function cityHubViewAllHref(displayCity: string): string {
  return `/clinics?city=${encodeURIComponent(displayCity)}`
}

export function cityHubCentroid(
  clinics: ReadonlyArray<{ lat?: number; lng?: number }>,
): { lat?: number; lng?: number } {
  let latSum = 0
  let lngSum = 0
  let count = 0
  for (const clinic of clinics) {
    const lat = Number(clinic.lat)
    const lng = Number(clinic.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) continue
    latSum += lat
    lngSum += lng
    count += 1
  }
  if (!count) return {}
  return { lat: latSum / count, lng: lngSum / count }
}

export function aggregateLiveCityHubs(
  rows: ReadonlyArray<{ city?: string | null; state?: string | null; lat?: number | null; lng?: number | null }>,
): LiveCityHub[] {
  const bySlug: Record<
    string,
    { slug: string; states: Record<string, number>; latSum: number; lngSum: number; coordCount: number }
  > = {}

  for (const row of rows) {
    if (!row.city) continue
    const slug = toCitySlug(String(row.city))
    if (!slug) continue
    let entry = bySlug[slug]
    if (!entry) {
      entry = { slug, states: {}, latSum: 0, lngSum: 0, coordCount: 0 }
      bySlug[slug] = entry
    }
    const state = String(row.state || '').trim().toUpperCase()
    if (state) entry.states[state] = (entry.states[state] || 0) + 1
    const lat = Number(row.lat)
    const lng = Number(row.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      entry.latSum += lat
      entry.lngSum += lng
      entry.coordCount += 1
    }
  }

  return Object.keys(bySlug).map((slug) => {
    const entry = bySlug[slug]
    let state: string | undefined
    let best = 0
    const stateKeys = Object.keys(entry.states)
    for (let i = 0; i < stateKeys.length; i++) {
      const abbr = stateKeys[i]
      const count = entry.states[abbr]
      if (count > best) {
        state = abbr
        best = count
      }
    }
    return {
      slug: entry.slug,
      state,
      lat: entry.coordCount ? entry.latSum / entry.coordCount : undefined,
      lng: entry.coordCount ? entry.lngSum / entry.coordCount : undefined,
    }
  })
}

/** Live hubs only. Hard max 100 mi for every candidate — never backfill farther same-state hubs. */
export function selectNearbyCityHubs(
  city: string,
  liveHubs: readonly LiveCityHub[],
  origin?: { lat?: number; lng?: number; state?: string },
): string[] {
  if (city === 'miami') return [...MIAMI_NEARBY_HUBS]
  if (!liveHubs.length) return []

  const self = liveHubs.find((hub) => hub.slug === city)
  const lat = origin?.lat ?? self?.lat
  const lng = origin?.lng ?? self?.lng
  const others = liveHubs.filter((hub) => hub.slug && hub.slug !== city)

  const scored = others.map((hub) => {
    const hasGeo =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Number.isFinite(hub.lat) &&
      Number.isFinite(hub.lng)
    const miles = hasGeo
      ? milesBetween(lat as number, lng as number, hub.lat as number, hub.lng as number)
      : Number.POSITIVE_INFINITY
    return { slug: hub.slug, miles }
  })

  const inRange = scored
    .filter((item) => item.miles <= NEARBY_MAX_MILES)
    .sort((a, b) => (a.miles !== b.miles ? a.miles - b.miles : a.slug.localeCompare(b.slug)))

  const picked: string[] = []
  for (const item of inRange) {
    if (picked.length >= NEARBY_HUB_LIMIT) break
    picked.push(item.slug)
  }
  return picked
}

export function buildCityHubSeo(city: string, context: CityHubSeoContext = {}): CitySeoOverride {
  const displayCity = citySlugToDisplay(city)
  const stateAbbr = (city === 'miami' ? 'FL' : context.stateAbbr || '').toUpperCase()
  const cityState = stateAbbr ? `${displayCity}, ${stateAbbr}` : displayCity
  const nearbyHubs = city === 'miami' ? MIAMI_NEARBY_HUBS : (context.nearbyHubs ?? [])

  return {
    title: `Best MedSpas in ${cityState} — GlowRoute`,
    description: `Find medical spas and aesthetic clinics in ${cityState}. Compare Botox, HydraFacial, laser, and more on GlowRoute.`,
    keywords: cityHubKeywords(displayCity),
    viewAllHref: cityHubViewAllHref(displayCity),
    canonicalPath: `/clinics/${city}`,
    nearbyHubs,
  }
}

export function getCitySeoOverride(city: string, context: CityHubSeoContext = {}): CitySeoOverride {
  return buildCityHubSeo(city, context)
}

export function getClinicSeoOverride(city: string, slug: string): ClinicSeoOverride | undefined {
  return CLINIC_SLUG_OVERRIDES[`${city}/${stripFlSuffix(slug)}`]
}

export function getClaimSeoOverride(slug: string): ClaimSeoOverride | undefined {
  return CLAIM_SLUG_OVERRIDES[stripFlSuffix(slug)]
}

/** Claim hub `/claim` may be indexed; individual `/claim/{slug}` pages must not. */
export function isClaimSlugInSitemap(_slug: string): boolean {
  return false
}

export const DEFAULT_CLINIC_CLAIM_PROMO =
  '430+ patients searched your area last month. Claim your listing to capture leads.'

export const LOCKED_CLINIC_CLAIM_PROMO = 'Claim your listing to capture leads.'

/** Claim-CTA body copy. Locked slugs drop 430+ / Verified social proof. */
export function clinicClaimPromoCopy(override?: ClinicSeoOverride | null): string {
  if (override?.suppressRankingPromo) return LOCKED_CLINIC_CLAIM_PROMO
  return DEFAULT_CLINIC_CLAIM_PROMO
}

export function showClinicVerifiedPromo(override?: ClinicSeoOverride | null): boolean {
  return !override?.suppressRankingPromo
}

export function sanitizeSeoText(text: string): string {
  return text
    .replace(/\b430\+?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function citySlugToDisplay(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
