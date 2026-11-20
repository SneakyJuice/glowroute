// @ts-expect-error -- Node's TypeScript test runner requires an explicit extension.
import { parseDirectoryCity } from './directory-search.ts'
// @ts-expect-error -- Node's TypeScript test runner requires an explicit extension.
import { METRO_ALIASES } from './metro-aliases.ts'
// @ts-expect-error -- Node's TypeScript test runner requires an explicit extension.
import { toCitySlug } from './seo-page-overrides.ts'

const ALL_CITIES = new Set(['all', 'nationwide', 'united states'])

const normalize = (value: string) => value.toLowerCase().replace(/[.-]/g, ' ').replace(/\s+/g, ' ').trim()

export function knownCitySlugsFromNames(cities: readonly string[]): Set<string> {
  const slugs = new Set<string>()
  for (const city of cities) {
    const slug = toCitySlug(city)
    if (slug) slugs.add(slug)
  }
  return slugs
}

/** Exact directory city first, then a metro alias whose target hub exists. */
export function resolveKnownCitySlug(rawCity: string, knownSlugs: ReadonlySet<string>): string | null {
  const parsed = parseDirectoryCity(rawCity)
  const normalized = normalize(parsed.city)
  if (!normalized || ALL_CITIES.has(normalized)) return null
  const exact = toCitySlug(parsed.city)
  if (exact && knownSlugs.has(exact)) return exact
  const alias = METRO_ALIASES[normalized]
  if (!alias) return null
  const aliasSlug = toCitySlug(alias)
  return aliasSlug && knownSlugs.has(aliasSlug) ? aliasSlug : null
}

/**
 * 308 target when the query is exactly one known city.
 * Extra filters stay on the noindex directory. Unknown cities stay put.
 */
export function cityQueryRedirectPath(
  params: Record<string, string | string[] | undefined>,
  knownSlugs: ReadonlySet<string>,
): string | null {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined)
  if (entries.length !== 1 || entries[0][0] !== 'city') return null
  const raw = entries[0][1]
  const city = Array.isArray(raw) ? (raw.length === 1 ? raw[0] : '') : raw
  if (!city?.trim()) return null
  const slug = resolveKnownCitySlug(city, knownSlugs)
  return slug ? `/clinics/${slug}` : null
}
