import { Clinic } from '@/types/clinic'
import { flClinics } from './fl-clinics'

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
function clean(clinic: Clinic): Clinic {
  const descGarbled =
    clinic.description && isGarbledDescription(clinic.description)

  return {
    ...clinic,
    description: descGarbled
      ? generateDescription(clinic)
      : clinic.description || generateDescription(clinic),
  }
}

// Deduplicate by slug (keep first occurrence), clean each record
// fl-clinics.ts is the canonical source — ~3,575 FL listings
const seen = new Set<string>()
export const allClinics: Clinic[] = flClinics
  .filter(c => {
    if (!c.slug || seen.has(c.slug)) return false
    seen.add(c.slug)
    return true
  })
  .map(clean)

export const featuredClinic = allClinics.find(c => c.featured) ?? allClinics[0]
export const standardClinics = allClinics.filter(c => c !== featuredClinic)
