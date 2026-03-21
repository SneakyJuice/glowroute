export interface Clinic {
  id: string
  name: string
  slug: string
  city: string
  state?: string
  neighborhood?: string
  distance?: string
  googleRating: number
  googleReviewCount: number
  treatments: string[]
  specialtyTreatments?: string[]
  verified: boolean
  featured?: boolean
  isNew?: boolean
  priceTier?: '$' | '$$' | '$$$' | '$$$$'
  availability?: string
  imageUrl?: string
  images?: string[]
  logo?: string
  description?: string
  address?: string
  phone?: string
  website?: string
  bookingUrl?: string
  instagram?: string
  mapsUrl?: string
  brandValues?: string[]
  lat?: number
  lng?: number
}

export interface FilterState {
  treatmentTypes: string[]
  distanceMiles: number
  minRating: number
  priceTiers: string[]
  verifiedOnly: boolean
  onlineBooking: boolean
  telehealth: boolean
  membershipPlans: boolean
  freeConsultation: boolean
}
