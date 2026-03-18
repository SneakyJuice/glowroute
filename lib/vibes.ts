import type { Clinic } from '@/types/clinic'

export type VibeTag = 'Medical-Grade' | 'Luxury' | 'Men-Focused' | 'Budget-Friendly' | 'Peptide Clinic' | 'Weight Loss' | 'Laser Specialist'

const MEDICAL_KEYWORDS = ['peptide', 'trt', 'testosterone', 'hormone', 'bpc-157', 'sermorelin', 'semaglutide', 'tirzepatide', 'glp-1', 'iv therapy', 'regenerative', 'medical']
const MENS_KEYWORDS = ["men's health", "men's", 'testosterone', 'trt', 'male', 'prostate', 'andropause', 'biodesign']
const PEPTIDE_KEYWORDS = ['peptide', 'bpc-157', 'sermorelin', 'growth hormone', 'ipamorelin']
const WEIGHT_KEYWORDS = ['semaglutide', 'ozempic', 'tirzepatide', 'glp-1', 'weight loss', 'wegovy', 'mounjaro']
const LASER_KEYWORDS = ['laser', 'ipl', 'photofacial', 'laser hair', 'laser skin', 'coolsculpting']

function matchesAny(haystack: string, keywords: string[]) {
  const lower = haystack.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

export function getVibeTags(clinic: Clinic): VibeTag[] {
  const tags: VibeTag[] = []
  const blob = [
    clinic.name,
    ...(clinic.treatments ?? []),
    ...(clinic.specialtyTreatments ?? []),
    clinic.description ?? '',
  ].join(' ')

  // Medical-Grade — peptide/hormone/IV signals
  if ((clinic as any).peptide || matchesAny(blob, MEDICAL_KEYWORDS)) {
    tags.push('Medical-Grade')
  }

  // Peptide Clinic — specific peptide keywords
  if (matchesAny(blob, PEPTIDE_KEYWORDS)) {
    tags.push('Peptide Clinic')
  }

  // Weight Loss specialist
  if (matchesAny(blob, WEIGHT_KEYWORDS)) {
    tags.push('Weight Loss')
  }

  // Laser Specialist
  if (matchesAny(blob, LASER_KEYWORDS)) {
    tags.push('Laser Specialist')
  }

  // Men-Focused
  if (matchesAny(blob, MENS_KEYWORDS)) {
    tags.push('Men-Focused')
  }

  // Luxury — high rating + substantial reviews
  if (clinic.googleRating >= 4.9 && clinic.googleReviewCount >= 200) {
    tags.push('Luxury')
  }

  // Budget-Friendly — low price tier, no luxury signals
  if (
    (clinic.priceTier === '$' || clinic.priceTier === '$$') &&
    !tags.includes('Luxury') &&
    !tags.includes('Medical-Grade')
  ) {
    tags.push('Budget-Friendly')
  }

  // Deduplicate and cap at 4
  const seen = new Set<string>()
  return tags.filter(t => { if (seen.has(t)) return false; seen.add(t); return true }).slice(0, 4)
}

// For cards — return max 2 most notable tags
export function getCardVibeTags(clinic: Clinic): VibeTag[] {
  return getVibeTags(clinic).slice(0, 2)
}

// ── Booking platform detection ────────────────────────────────────────────────
export type BookingPlatform = {
  label: string
  platform: string
  url: string
}

const BOOKING_PLATFORMS: Array<{ domain: string; label: string; platform: string }> = [
  { domain: 'fresha.com',              label: 'Books via Fresha',    platform: 'fresha'    },
  { domain: 'vagaro.com',              label: 'Books via Vagaro',    platform: 'vagaro'    },
  { domain: 'acuityscheduling.com',    label: 'Books via Acuity',    platform: 'acuity'    },
  { domain: 'mindbodyonline.com',      label: 'Books via Mindbody',  platform: 'mindbody'  },
  { domain: 'squareup.com',            label: 'Books via Square',    platform: 'square'    },
  { domain: 'booksy.com',              label: 'Books via Booksy',    platform: 'booksy'    },
  { domain: 'zocdoc.com',              label: 'Books via ZocDoc',    platform: 'zocdoc'    },
]

export function detectBookingPlatform(clinic: Clinic): BookingPlatform | null {
  const urls = [clinic.bookingUrl, clinic.website].filter(Boolean) as string[]

  for (const url of urls) {
    for (const p of BOOKING_PLATFORMS) {
      if (url.toLowerCase().includes(p.domain)) {
        return { label: p.label, platform: p.platform, url }
      }
    }
  }

  if (clinic.bookingUrl) {
    return { label: 'Online Booking Available', platform: 'generic', url: clinic.bookingUrl }
  }

  return null
}

// ── Vibe tag styling ──────────────────────────────────────────────────────────
export const VIBE_STYLES: Record<VibeTag, string> = {
  'Medical-Grade':   'bg-blue-50 border-blue-200 text-blue-700',
  'Luxury':          'bg-amber-50 border-amber-200 text-amber-700',
  'Men-Focused':     'bg-slate-50 border-slate-300 text-slate-700',
  'Budget-Friendly': 'bg-green-50 border-green-200 text-green-700',
  'Peptide Clinic':  'bg-purple-50 border-purple-200 text-purple-700',
  'Weight Loss':     'bg-teal/5 border-teal/20 text-teal',
  'Laser Specialist':'bg-rose-50 border-rose-200 text-rose-700',
}
