export interface Clinic {
  id: string
  name: string
  slug: string
  city: string
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
  description?: string
  address?: string
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
