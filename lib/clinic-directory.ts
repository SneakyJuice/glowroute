/**
 * Shared shape for visible-clinic directory reads.
 * Callers that need the full list use this projection instead of select=*.
 */

export const DIRECTORY_PAGE_SIZE = 400

/** Shared by directory pages, sitemaps, and jobs so a cold start does not refetch all day. */
export const DIRECTORY_REVALIDATE_SECONDS = 3600

/**
 * Columns the public directory, city hubs, treatment filters, and profile cards read.
 * Internal contact, billing, and enrichment columns stay off this list.
 */
export const DIRECTORY_COLUMNS = [
  'id',
  'slug',
  'name',
  'description',
  'address',
  'city',
  'state',
  'lat',
  'lng',
  'phone',
  'website',
  'instagram_handle',
  'hero_image_url',
  'logo_url',
  'is_verified',
  'is_claimed',
  'is_featured',
  'review_count',
  'glow_score',
  'goals',
  'services',
  'visibility',
] as const

export const DIRECTORY_SELECT = DIRECTORY_COLUMNS.join(',')

export type DirectoryCursor = {
  glowScore: number | null
  id: string
}

export function encodeDirectoryCursor(cursor: DirectoryCursor | null): string {
  if (!cursor) return ''
  return JSON.stringify([cursor.glowScore, cursor.id])
}

export function decodeDirectoryCursor(key: string): DirectoryCursor | null {
  if (!key) return null
  const parsed = JSON.parse(key) as [number | null, string]
  return { glowScore: parsed[0], id: parsed[1] }
}

/**
 * PostgREST `or` filter for the next page after ORDER BY glow_score DESC NULLS LAST, id ASC.
 * Null scores sort last, so they stay in the remaining set until every scored row is consumed.
 */
export function directoryKeysetFilter(cursor: DirectoryCursor | null): string | null {
  if (!cursor) return null
  if (cursor.glowScore === null) {
    return `and(glow_score.is.null,id.gt.${cursor.id})`
  }
  return [
    `glow_score.lt.${cursor.glowScore}`,
    `and(glow_score.eq.${cursor.glowScore},id.gt.${cursor.id})`,
    'glow_score.is.null',
  ].join(',')
}

export function cursorFromDirectoryRow(row: {
  glow_score?: number | string | null
  id?: string | number | null
}): DirectoryCursor {
  const raw = row.glow_score
  const numeric = raw === null || raw === undefined || raw === '' ? null : Number(raw)
  return {
    glowScore: numeric === null || Number.isNaN(numeric) ? null : numeric,
    id: String(row.id ?? ''),
  }
}

export type DirectorySortKey = {
  glowScore: number | null
  id: string
}

/** Same order as the directory query: glow_score DESC NULLS LAST, id ASC. */
export function compareDirectoryOrder(a: DirectorySortKey, b: DirectorySortKey): number {
  const aNull = a.glowScore === null
  const bNull = b.glowScore === null
  if (aNull !== bNull) return aNull ? 1 : -1
  if (!aNull && !bNull && a.glowScore !== b.glowScore) {
    return (b.glowScore as number) - (a.glowScore as number)
  }
  if (a.id < b.id) return -1
  if (a.id > b.id) return 1
  return 0
}

/** True when `row` comes strictly after `cursor` in directory order. */
export function isAfterDirectoryCursor(row: DirectorySortKey, cursor: DirectoryCursor): boolean {
  return compareDirectoryOrder(row, { glowScore: cursor.glowScore, id: cursor.id }) > 0
}

export function sqlIlikeMatch(value: string | null | undefined, pattern: string): boolean {
  if (!value) return false
  const expression = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.')
  return new RegExp(`^${expression}$`, 'i').test(value)
}

type CityClinic = {
  id: string
  slug: string
  city?: string
  glowScore?: number
}

/**
 * Same match as the old city query: exact city name, then a case-insensitive fallback.
 * Input order is preserved so the cached directory order stays stable.
 */
export function filterClinicsForCitySlug<T extends CityClinic>(clinics: readonly T[], citySlug: string): T[] {
  const displayName = citySlug
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
  const exact = clinics.filter((clinic) => clinic.city === displayName)
  if (exact.length > 0) return [...exact]
  const pattern = displayName.replace(/-/g, '%')
  return clinics.filter((clinic) => sqlIlikeMatch(clinic.city, pattern))
}

export function dedupeClinicsBySlug<T extends CityClinic>(clinics: readonly T[]): T[] {
  const sorted = [...clinics].sort((a, b) =>
    compareDirectoryOrder(
      { glowScore: a.glowScore ?? null, id: a.id },
      { glowScore: b.glowScore ?? null, id: b.id },
    ),
  )
  const seen = new Set<string>()
  const unique: T[] = []
  for (const clinic of sorted) {
    if (!clinic.slug || seen.has(clinic.slug)) continue
    seen.add(clinic.slug)
    unique.push(clinic)
  }
  return unique
}
