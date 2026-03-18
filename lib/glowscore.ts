import type { Clinic } from '@/types/clinic'
import { isPeptideClinic } from '@/lib/peptide'
import { detectInfluencer } from '@/lib/influencer'

export type GlowTier = 'Elite' | 'Verified' | 'Standard' | 'Basic'

export interface GlowScoreBreakdown {
  /** 0–30 pts: (rating / 5) × 30 */
  rating: number
  /** 0–20 pts: log scale, 200+ reviews = 20 pts */
  reviewVolume: number
  /** 0–20 pts: photo (5) + services (5) + address (5) + phone (5) */
  profileComplete: number
  /** 0–15 pts: booking_url = 15, website only = 5 */
  bookingActive: number
  /** 0–10 pts: peptide_flag / broad peptide match = 10 */
  peptideSignal: number
  /** 0–5 pts: bonus for creator/influencer signal */
  creatorSignal: number
  /** total 0–100 */
  total: number
  /** tier based on total */
  tier: GlowTier
}

export function calculateGlowScore(clinic: Clinic): GlowScoreBreakdown {
  // ── Rating component (0–30) ────────────────────────────────────────────
  // Only award points if there are meaningful reviews
  const ratingPts = clinic.googleReviewCount > 0
    ? Math.round((Math.min(clinic.googleRating, 5) / 5) * 30)
    : 0

  // ── Review volume (0–20): log scale ───────────────────────────────────
  // log10(reviews+1) / log10(201) ≈ 0..1, × 20
  const reviewPts = Math.min(
    20,
    Math.round((Math.log10(clinic.googleReviewCount + 1) / Math.log10(201)) * 20),
  )

  // ── Profile completeness (0–20): 5 pts each ───────────────────────────
  const hasPhoto = !!(clinic.imageUrl || (clinic.images && clinic.images.length > 0) || clinic.logo)
  const hasServices = (clinic.treatments?.length ?? 0) > 0
  const hasAddress = !!clinic.address
  const hasPhone = !!clinic.phone
  const profilePts =
    (hasPhoto    ? 5 : 0) +
    (hasServices ? 5 : 0) +
    (hasAddress  ? 5 : 0) +
    (hasPhone    ? 5 : 0)

  // ── Booking active (0–15) ─────────────────────────────────────────────
  const bookingPts = clinic.bookingUrl ? 15 : (clinic.website ? 5 : 0)

  // ── Peptide signal (0–10) ─────────────────────────────────────────────
  const peptidePts = isPeptideClinic(clinic) ? 10 : 0

  // ── Creator signal (0–5) ─────────────────────────────────────────────
  const creatorPts = detectInfluencer(clinic) ? 5 : 0

  const total = Math.min(
    100,
    ratingPts + reviewPts + profilePts + bookingPts + peptidePts + creatorPts,
  )

  const tier: GlowTier =
    total >= 80 ? 'Elite'    :
    total >= 60 ? 'Verified' :
    total >= 40 ? 'Standard' :
    'Basic'

  return {
    rating: ratingPts,
    reviewVolume: reviewPts,
    profileComplete: profilePts,
    bookingActive: bookingPts,
    peptideSignal: peptidePts,
    creatorSignal: creatorPts,
    total,
    tier,
  }
}

export const TIER_COLORS: Record<GlowTier, { bg: string; text: string; border: string; ring: string }> = {
  Elite:    { bg: 'bg-champagne/10', text: 'text-champagne', border: 'border-champagne/30', ring: '#C9A96E' },
  Verified: { bg: 'bg-teal-50',      text: 'text-teal-700',  border: 'border-teal-200',     ring: '#0d9488' },
  Standard: { bg: 'bg-sage/10',      text: 'text-sage',      border: 'border-sage/30',      ring: '#4A6741' },
  Basic:    { bg: 'bg-gray-50',      text: 'text-gray-500',  border: 'border-gray-200',     ring: '#9ca3af' },
}
