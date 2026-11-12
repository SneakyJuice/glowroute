import type { Clinic, FilterState } from '@/types/clinic'
// Explicit extensions keep this pure module runnable in Node's TypeScript test runner.
// @ts-expect-error -- TypeScript is checked with noEmit; Node requires the extension.
import { calculateGlowScore } from './glowscore.ts'
// @ts-expect-error -- Node TypeScript test runner requires an explicit extension.
import { haversine } from './geo.ts'
// @ts-expect-error -- Node TypeScript test runner requires an explicit extension.
import { METRO_ALIASES } from './metro-aliases.ts'
// @ts-expect-error -- Node TypeScript test runner requires an explicit extension.
import { CATEGORIES } from '../data/categories.ts'
// @ts-expect-error -- Node TypeScript test runner requires an explicit extension.
import { detectBookingPlatform } from './vibes.ts'
import taxonomy from './taxonomy.json' with { type: 'json' }

export const DIRECTORY_LIMIT = 20
export const DIRECTORY_DEFAULT_FILTERS: FilterState = {
  treatmentTypes: [], goals: [], distanceMiles: 25, minRating: 0,
  priceTiers: [], verifiedOnly: false, onlineBooking: false,
  telehealth: false, membershipPlans: false, freeConsultation: false,
}
export interface DirectoryQuery {
  city: string; q: string; specialty: string; distance: number | null
  page: number; limit: number; sort: string; filters: FilterState
  lat?: number; lng?: number
}
export interface DirectoryPage {
  data: Clinic[]; featuredClinic: Clinic | null; total: number; count: number
  page: number; limit: number; totalPages: number; query: DirectoryQuery
  cityLabel: string; distanceApplied: boolean
}
export class DirectoryQueryError extends Error {}
type Params = URLSearchParams | Record<string, string | string[] | undefined>

export function directoryParams(input: Params): URLSearchParams {
  if (input instanceof URLSearchParams) return input
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item)
  }
  return params
}

function numberParam(params: URLSearchParams, key: string, fallback: number, min: number, max: number, integer = false) {
  const raw = params.get(key)
  if (raw === null) return fallback
  const number = Number(raw)
  if (!raw.trim() || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isSafeInteger(number))) {
    throw new DirectoryQueryError(`${key} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}.`)
  }
  return number
}
const list = (p: URLSearchParams, key: string) => Array.from(new Set(p.getAll(key).flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean)))
const normalize = (value: string) => value.toLowerCase().replace(/[.-]/g, ' ').replace(/\s+/g, ' ').trim()

/** Strip a complete state suffix, never a substring such as the 'fl' in a city name. */
export function parseDirectoryCity(value: string): { city: string; state: string } {
  const trimmed = value.trim()
  const suffix = trimmed.match(/^(.*?),\s*([a-z]{2}|florida)$/i) ?? trimmed.match(/^(.*?)\s+([A-Z]{2}|Florida)$/)
  return { city: (suffix ? suffix[1] : trimmed).trim(), state: suffix ? (suffix[2].toLowerCase() === 'florida' ? 'FL' : suffix[2].toUpperCase()) : '' }
}

export function parseDirectoryQuery(input: Params): DirectoryQuery {
  const p = directoryParams(input)
  const hasPosition = p.has('lat') || p.has('lng')
  if (hasPosition && !(p.has('lat') && p.has('lng'))) throw new DirectoryQueryError('lat and lng must be provided together.')
  // City-hub "View all" links mean that city's records; submitted radius searches are explicit.
  const rawDistance = p.get('distance') ?? (p.has('city') ? 'any' : '25')
  const distance = rawDistance === 'any' ? null : numberParam(new URLSearchParams({ distance: rawDistance }), 'distance', 25, 1, 250)
  // Validate legacy numeric input, but do not apply ratings until source provenance exists.
  numberParam(p, 'rating', 0, 0, 5)
  const filters: FilterState = {
    ...DIRECTORY_DEFAULT_FILTERS,
    goals: list(p, 'goal'), treatmentTypes: list(p, 'treatment'), priceTiers: list(p, 'price'),
    minRating: 0, distanceMiles: distance ?? 0,
    verifiedOnly: p.get('verified') === 'true', onlineBooking: p.get('booking') === 'true',
  }
  for (const key of ['telehealth', 'membershipPlans', 'freeConsultation']) {
    if (p.get(key) === 'true') throw new DirectoryQueryError('This feature filter is unavailable because provider data has not been verified.')
  }
  const specialty = (p.get('specialty') ?? '').trim()
  if (specialty && !CATEGORIES.some(c => c.slug === specialty)) throw new DirectoryQueryError('Unknown specialty filter.')
  const sort = ['Highest Rated', 'Price: Low to High'].includes(p.get('sort') ?? '') ? 'GlowScore™' : p.get('sort') ?? 'GlowScore™'
  if (!['GlowScore™', 'Highest Rated', 'Most Reviewed', 'Nearest First', 'Price: Low to High'].includes(sort)) throw new DirectoryQueryError('Unknown sort order.')
  return {
    city: (p.get('city') ?? (hasPosition ? '' : 'Miami')).trim().slice(0, 150),
    q: (p.get('q') ?? '').trim().slice(0, 200), specialty, distance,
    page: numberParam(p, 'page', 1, 1, 100000, true),
    limit: numberParam(p, 'limit', DIRECTORY_LIMIT, 1, 100, true), sort, filters,
    ...(hasPosition ? {lat: numberParam(p, 'lat', 0, -90, 90), lng: numberParam(p, 'lng', 0, -180, 180)} : {}),
  }
}

export function serializeDirectoryQuery(query: DirectoryQuery): URLSearchParams {
  const p = new URLSearchParams({ city: query.city, distance: query.distance === null ? 'any' : String(query.distance), page: String(query.page) })
  if (query.q) p.set('q', query.q)
  if (query.specialty) p.set('specialty', query.specialty)
  if (query.limit !== DIRECTORY_LIMIT) p.set('limit', String(query.limit))
  if (query.sort !== 'GlowScore™') p.set('sort', query.sort)
  query.filters.goals.forEach(v => p.append('goal', v))
  query.filters.treatmentTypes.forEach(v => p.append('treatment', v))
  query.filters.priceTiers.forEach(v => p.append('price', v))
  if (query.filters.minRating) p.set('rating', String(query.filters.minRating))
  if (query.filters.verifiedOnly) p.set('verified', 'true')
  if (query.filters.onlineBooking) p.set('booking', 'true')
  if (query.lat !== undefined && query.lng !== undefined) { p.set('lat', String(query.lat)); p.set('lng', String(query.lng)) }
  return p
}

const validPosition = (c: {lat?: number; lng?: number}) => Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat!) <= 90 && Math.abs(c.lng!) <= 180 && (c.lat !== 0 || c.lng !== 0)
const median = (values: number[]) => { const sorted = [...values].sort((a,b) => a-b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle-1] + sorted[middle]) / 2 }
const scores = new WeakMap<Clinic, number>()
const score = (c: Clinic) => { let value = scores.get(c); if (value === undefined) { value = calculateGlowScore(c).total; scores.set(c, value) } return value }
const serviceFilters = taxonomy.serviceFilters as Array<{slug: string; aliases: string[]}>
const searchableServices = (c: Clinic) => [...(c.services ?? []), ...(c.treatments ?? []), ...(c.specialtyTreatments ?? [])].map(normalize).join(' ')

/** The complete pool remains server-side; only this bounded result is serialized. */
export function searchDirectory(pool: readonly Clinic[], query: DirectoryQuery): DirectoryPage {
  const visible = pool.filter(c => c.id && c.city && c.slug && (!c.visibility || c.visibility === 'visible'))
  const parsedCity = parseDirectoryCity(query.city)
  const rawCity = normalize(parsedCity.city)
  const exactCityExists = visible.some(c => normalize(c.city) === rawCity)
  // Only exact aliases: partial alias matching turns unrelated cities into Miami/LA/etc.
  const canonicalCity = exactCityExists ? parsedCity.city : METRO_ALIASES[rawCity] ?? parsedCity.city
  const cityKey = normalize(canonicalCity)
  const allCities = !cityKey || ['all', 'nationwide', 'united states'].includes(cityKey)
  const cityMatches = (c: Clinic) => normalize(c.city) === cityKey && (!parsedCity.state || normalize(c.state ?? '') === normalize(parsedCity.state))
  const cityPool = allCities ? [] : visible.filter(cityMatches)
  const points = cityPool.filter(validPosition)
  const origin = query.lat !== undefined && query.lng !== undefined ? {lat: query.lat, lng: query.lng}
    : points.length ? {lat: median(points.map(c => c.lat!)), lng: median(points.map(c => c.lng!))} : null
  const distanceApplied = !!origin && query.distance !== null
  const distanceTo = (c: Clinic) => origin && validPosition(c) ? haversine(origin.lat, origin.lng, c.lat!, c.lng!) : Infinity
  let result = visible.filter(c => {
    // An unknown/missing geocode cannot truthfully satisfy a radius search.
    if (distanceApplied ? distanceTo(c) > query.distance! : !allCities && !cityMatches(c)) return false
    const services = searchableServices(c)
    const text = normalize([c.name, services, c.description ?? ''].join(' '))
    if (query.q && !text.includes(normalize(query.q))) return false
    if (query.specialty) {
      const category = CATEGORIES.find(c => c.slug === query.specialty)!
      if (!category.keywords.some(k => services.includes(normalize(k)))) return false
    }
    if (query.filters.treatmentTypes.length && !query.filters.treatmentTypes.some(slug => {
      const aliases = serviceFilters.find(s => s.slug === slug)?.aliases ?? [slug]
      return aliases.some(a => services.includes(normalize(a)))
    })) return false
    if (query.filters.goals.length && !query.filters.goals.some(g => (c.goals ?? []).includes(g))) return false
    if (c.googleRating < query.filters.minRating) return false
    if (query.filters.priceTiers.length && (!c.priceTier || !query.filters.priceTiers.includes(c.priceTier))) return false
    if (query.filters.verifiedOnly && !c.verified) return false
    if (query.filters.onlineBooking && !detectBookingPlatform(c)) return false
    return true
  })
  result.sort((a,b) => {
    let order = 0
    if (query.sort === 'Highest Rated') order = b.googleRating - a.googleRating || b.googleReviewCount - a.googleReviewCount
    else if (query.sort === 'Most Reviewed') order = b.googleReviewCount - a.googleReviewCount
    else if (query.sort === 'Nearest First') order = distanceTo(a) - distanceTo(b)
    else if (query.sort === 'Price: Low to High') order = (a.priceTier?.length ?? 99) - (b.priceTier?.length ?? 99)
    else order = score(b) - score(a)
    return order || a.id.localeCompare(b.id)
  })
  // Only a genuinely featured matching record is promoted; never default to an arbitrary clinic.
  const featured = result.find(c => c.featured) ?? null
  if (featured) result = [featured, ...result.filter(c => c.id !== featured.id)]
  const total = result.length
  const totalPages = Math.ceil(total / query.limit)
  const page = Math.min(query.page, Math.max(totalPages, 1))
  const slice = result.slice((page - 1) * query.limit, page * query.limit)
  const featuredClinic = featured && slice.some(c => c.id === featured.id) ? featured : null
  const labelCity = cityPool[0]?.city ?? canonicalCity
  const state = parsedCity.state || cityPool[0]?.state
  const card = (clinic: Clinic): Clinic => ({ ...clinic, description: clinic.description?.slice(0, 600), images: clinic.images?.slice(0, 1) })
  return {
    data: slice.filter(c => c.id !== featuredClinic?.id).map(card), featuredClinic: featuredClinic ? card(featuredClinic) : null,
    total, count: slice.length, page, limit: query.limit, totalPages,
    query: {...query, page}, cityLabel: query.lat !== undefined ? 'Your location' : allCities ? 'All cities' : `${labelCity}${state ? `, ${state}` : ''}`,
    distanceApplied,
  }
}
