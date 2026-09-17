/** Locked GlowRoute directory SEO overrides. Targeted slugs only. */

export const GUIDE_YEAR = 2026

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

function stripFlSuffix(slug: string): string {
  return slug.replace(/-fl$/, '')
}

/** Locked URLs drop `-fl`; local/static rows sometimes keep it. Try both. */
export function clinicSlugLookupCandidates(slug: string): string[] {
  const stripped = stripFlSuffix(slug)
  const withFl = stripped.endsWith('-fl') ? stripped : `${stripped}-fl`
  return Array.from(new Set([slug, stripped, withFl].filter(Boolean)))
}

export function getCitySeoOverride(city: string): CitySeoOverride | undefined {
  if (city === 'miami') return MIAMI_CITY_METADATA
  return undefined
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
