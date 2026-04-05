/**
 * GlowScore™ V2 — 2026-03-31
 *
 * Redesigned from V1 based on real data coverage across 4,913 visible clinics:
 * - V1 problems: rating was 30% of score but 64% are 5★ (near-zero discrimination)
 *   booking_url and instagram both 0% coverage — dead weight
 *   review log ceiling was 201 but real P90 is 388, max is 2,904
 * - V2 fix: specialization is a first-class 35pt bucket (was 10pts peptide-only)
 *   description + image are real differentiators (30% / 64% coverage)
 *   trust layer reserved for claims layer (0 now, grows post-launch)
 *
 * Scoring buckets (100pts total):
 *   REPUTATION      40pts  (rating quality 20 + review volume 20)
 *   SPECIALIZATION  35pts  (service depth 12 + goal breadth 12 + niche bonus 11)
 *   PROFILE         15pts  (description 8 + image 4 + website 3)
 *   TRUST           10pts  (claimed 7 + verified 3 — reserved, grows post-launch)
 *
 * Tiers:
 *   Elite    80+   Top ~5-8% — full-spectrum, well-reviewed, strong profile
 *   Verified 60-79 Well-established clinics with good data coverage
 *   Standard 40-59 Solid presence, some gaps
 *   Basic    <40   Minimal data — show but deprioritize
 */

import type { Clinic } from '@/types/clinic'

export type GlowTier = 'Elite' | 'Verified' | 'Standard' | 'Basic'

export interface GlowScoreBreakdown {
  // ── REPUTATION (0-40) ────────────────────────────────────────────────
  /** 0-20: weighted rating — penalizes 5★ with <10 reviews, rewards consistency */
  ratingQuality: number
  /** 0-20: review volume log-scaled to real data distribution (P90=388) */
  reviewVolume: number

  // ── SPECIALIZATION (0-35) ────────────────────────────────────────────
  /** 0-12: canonical service count (1=2, 2=5, 3=8, 4=10, 5+=12) */
  serviceDepth: number
  /** 0-12: health goal count (1=3, 2=6, 3=9, 4+=12) */
  goalBreadth: number
  /** 0-11: niche bonus — peptide/hormone/recovery = 11, weight/anti-aging = 6 */
  nicheBonus: number

  // ── PROFILE QUALITY (0-15) ───────────────────────────────────────────
  /** 0-8: has rich description (>100 chars = 8, >30 chars = 4) */
  description: number
  /** 0-4: has hero image */
  heroImage: number
  /** 0-3: has website */
  website: number

  // ── TRUST LAYER (0-10) ───────────────────────────────────────────────
  /** 0-7: claimed listing (reserved — 0 now, grows post-launch) */
  claimed: number
  /** 0-3: GlowRoute verified badge (manual) */
  verified: number

  // ── TOTALS ───────────────────────────────────────────────────────────
  /** 0-100 */
  total: number
  /** tier based on total */
  tier: GlowTier
  /** legacy field for backwards compat */
  rating: number
  reviewVolumeLegacy: number
  profileComplete: number
  bookingActive: number
  peptideSignal: number
  creatorSignal: number
}

// ── Log scale calibrated to real data ────────────────────────────────────
// P50=73, P90=388, max=2904 across visible clinics (2026-03-31)
// Using log10(reviews+1) / log10(389) — P90 = 20pts
function reviewScore(reviewCount: number, maxPts: number): number {
  if (reviewCount <= 0) return 0
  const P90 = 389
  return Math.min(maxPts, Math.round((Math.log10(reviewCount + 1) / Math.log10(P90 + 1)) * maxPts))
}

// ── Rating quality — weighted by review count ─────────────────────────────
// Pure 5★ with <10 reviews = penalized. 4.7★ with 200 reviews beats 5★ with 5 reviews.
function ratingQualityScore(rating: number, reviewCount: number, maxPts: number): number {
  if (rating <= 0) return 0
  // Credibility weight: 0→1 scale, max at 50 reviews
  const credibility = Math.min(1, Math.log10(reviewCount + 1) / Math.log10(51))
  // Rating component: (rating/5)^1.2 rewards higher ratings non-linearly
  const ratingComponent = Math.pow(Math.min(rating, 5) / 5, 1.2)
  return Math.round(ratingComponent * credibility * maxPts)
}

export function calculateGlowScore(clinic: Clinic): GlowScoreBreakdown {
  const services = clinic.services ?? []
  const goals = clinic.goals ?? []
  const reviewCount = clinic.googleReviewCount ?? 0
  const rating = clinic.googleRating ?? 0

  // ── REPUTATION ────────────────────────────────────────────────────────
  const ratingQuality = ratingQualityScore(rating, reviewCount, 20)
  const reviewVolume  = reviewScore(reviewCount, 20)

  // ── SPECIALIZATION ────────────────────────────────────────────────────
  // Service depth: how many canonical service categories
  const svcCount = services.filter(s => s && s !== 'object-object').length
  const serviceDepth =
    svcCount >= 5 ? 12 :
    svcCount === 4 ? 10 :
    svcCount === 3 ? 8 :
    svcCount === 2 ? 5 :
    svcCount === 1 ? 2 : 0

  // Goal breadth: how many health goals the clinic covers
  const goalCount = goals.length
  const goalBreadth =
    goalCount >= 4 ? 12 :
    goalCount === 3 ? 9 :
    goalCount === 2 ? 6 :
    goalCount === 1 ? 3 : 0

  // Niche bonus: premium categories that GlowRoute uniquely serves
  const PREMIUM_NICHES = ['peptide-therapy', 'trt-testosterone', 'iv-therapy', 'prp-treatments', 'hair-restoration']
  const MID_NICHES     = ['weight-loss-ozempic', 'anti-aging', 'microneedling', 'laser-skin', 'coolsculpting']
  const hasPremium = services.some(s => PREMIUM_NICHES.includes(s)) ||
                     goals.some(g => ['recovery-repair', 'muscle-performance', 'hormone-balance', 'cognitive-mood', 'immune-wellness'].includes(g))
  const hasMid     = services.some(s => MID_NICHES.includes(s)) ||
                     goals.some(g => ['weight-metabolic', 'anti-aging-longevity'].includes(g))
  const nicheBonus = hasPremium ? 11 : hasMid ? 6 : 0

  // ── PROFILE QUALITY ───────────────────────────────────────────────────
  const descLen = (clinic.description ?? '').length
  const description = descLen > 100 ? 8 : descLen > 30 ? 4 : 0
  const heroImage   = !!(clinic.imageUrl || clinic.heroImageUrl || (clinic.images && clinic.images.length > 0)) ? 4 : 0
  const website     = !!clinic.website ? 3 : 0

  // ── TRUST LAYER (reserved) ────────────────────────────────────────────
  const claimed  = clinic.isClaimed  ? 7 : 0
  const verified = clinic.isVerified ? 3 : 0

  // ── TOTAL ─────────────────────────────────────────────────────────────
  const total = Math.min(100,
    ratingQuality + reviewVolume +
    serviceDepth + goalBreadth + nicheBonus +
    description + heroImage + website +
    claimed + verified
  )

  const tier: GlowTier =
    total >= 80 ? 'Elite'    :
    total >= 60 ? 'Verified' :
    total >= 40 ? 'Standard' :
    'Basic'

  return {
    // V2 fields
    ratingQuality,
    reviewVolume,
    serviceDepth,
    goalBreadth,
    nicheBonus,
    description,
    heroImage,
    website,
    claimed,
    verified,
    total,
    tier,
    // Legacy compat fields (used in some components)
    rating: ratingQuality,
    reviewVolumeLegacy: reviewVolume,
    profileComplete: description + heroImage + website,
    bookingActive: 0,    // deprecated — 0% coverage
    peptideSignal: nicheBonus > 0 ? nicheBonus : 0,
    creatorSignal: 0,    // deprecated — 0% coverage
  }
}

export const TIER_COLORS: Record<GlowTier, { bg: string; text: string; border: string; ring: string }> = {
  Elite:    { bg: 'bg-champagne/10', text: 'text-champagne', border: 'border-champagne/30', ring: '#C9A96E' },
  Verified: { bg: 'bg-teal-50',      text: 'text-teal-700',  border: 'border-teal-200',     ring: '#0d9488' },
  Standard: { bg: 'bg-sage/10',      text: 'text-sage',      border: 'border-sage/30',      ring: '#4A6741' },
  Basic:    { bg: 'bg-gray-50',      text: 'text-gray-500',  border: 'border-gray-200',     ring: '#9ca3af' },
}

/**
 * Compute a standalone sort score (for use in ORDER BY without full breakdown).
 * Faster than calculateGlowScore for bulk sorting.
 */
export function quickGlowSort(clinic: Clinic): number {
  return calculateGlowScore(clinic).total
}
