import type { Clinic } from '@/types/clinic'
import { isPeptideClinic } from '@/lib/peptide'

/**
 * ENRICHMENT PIPELINE NOTE:
 * The `instagramHandle` and `tiktokHandle` fields on the Clinic type will be populated
 * in two ways:
 *   1. During clinic onboarding (claimed listing flow — owner enters handles manually)
 *   2. Future Apify enrichment pass — automated scraping of clinic websites and Google
 *      Business profiles to extract social media links and handles at scale
 *
 * Once real follower counts are available (via Instagram Graph API or Apify social scraper),
 * `getInfluencerTier()` should be updated to use actual follower_count rather than the
 * review volume proxy currently in use.
 */

// Keywords suggesting a practitioner-led / personally branded clinic
const PRACTITIONER_KEYWORDS = [
  'np ', ' np,', 'nurse practitioner', 'injector', 'aesthetic nurse',
  'aesthetic injector', 'master injector', 'rn ', ' rn,', 'arnp',
  'pa-c', 'physician assistant', 'medically directed', 'provider',
  'by dr ', 'by dr.', 'founded by', 'owned by', 'aesthetic by',
]

// High social signal words (often in descriptions of creator clinics)
const SOCIAL_KEYWORDS = [
  'instagram', 'tiktok', 'social media', 'content creator', 'influencer',
  'follow us', 'as seen on', 'featured in', 'media', 'brand ambassador',
]

function haystack(clinic: Clinic): string {
  return [
    clinic.name,
    clinic.description ?? '',
    ...(clinic.brandValues ?? []),
    ...(clinic.treatments ?? []),
  ].join(' ').toLowerCase()
}

/**
 * Detect whether a clinic has notable social/influencer signals.
 * Since we don't have follower_count fields, we use proxy signals:
 *   1. Practitioner keywords in name/description
 *   2. Social media keywords in description/brandValues
 *   3. High review count (>300) + peptide signal (proxy for social-savvy operator)
 *   4. Very high review count (>500) alone
 *   5. Has an Instagram URL in data
 */
export function detectInfluencer(clinic: Clinic): boolean {
  const hay = haystack(clinic)

  const hasPractitionerKeyword = PRACTITIONER_KEYWORDS.some(k => hay.includes(k))
  const hasSocialKeyword = SOCIAL_KEYWORDS.some(k => hay.includes(k))
  const hasInstagram = !!(clinic as any).instagram
  const highReviews = clinic.googleReviewCount > 300
  const veryHighReviews = clinic.googleReviewCount > 500
  const isPeptide = isPeptideClinic(clinic)

  // Require at least one strong signal
  if (hasInstagram) return true
  if (hasSocialKeyword) return true
  if (hasPractitionerKeyword && highReviews) return true
  if (veryHighReviews && isPeptide) return true

  return false
}

export type InfluencerTier = 'Micro' | 'Mid' | 'Macro'

/**
 * Tier based on review count as follower proxy.
 * Real follower data not available — review volume correlates with social reach.
 */
export function getInfluencerTier(clinic: Clinic): InfluencerTier | null {
  if (!detectInfluencer(clinic)) return null
  const reviews = clinic.googleReviewCount
  if (reviews >= 2000) return 'Macro'
  if (reviews >= 500) return 'Mid'
  return 'Micro'
}
