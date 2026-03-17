import { Clinic } from '@/types/clinic'
import { flClinics } from './fl-clinics'

// Deduplicate by slug (keep first occurrence)
// fl-clinics.ts is the canonical source — ~3,575 FL listings
const seen = new Set<string>()
export const allClinics: Clinic[] = flClinics.filter(c => {
  if (!c.slug || seen.has(c.slug)) return false
  seen.add(c.slug)
  return true
})

export const featuredClinic = allClinics.find(c => c.featured) ?? allClinics[0]
export const standardClinics = allClinics.filter(c => c !== featuredClinic)
