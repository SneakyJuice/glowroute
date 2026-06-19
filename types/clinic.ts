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
  imageUrl?: string          // canonical single hero image field
  images?: string[]           // multi-image gallery; NOT a 1-element echo of imageUrl
  logo?: string
  description?: string
  address?: string
  phone?: string
  website?: string
  bookingUrl?: string
  instagram?: string
  instagramHandle?: string
  tiktokHandle?: string
  icalUrl?: string
  mapsUrl?: string
  brandValues?: string[]
  lat?: number
  lng?: number
  goals?: string[]
  services?: string[]
  visibility?: 'visible' | 'hidden' | 'removed' | 'needs_review'
  /** @deprecated alias for imageUrl — use imageUrl instead */
  heroImageUrl?: string
  isClaimed?: boolean
  isVerified?: boolean
  dataQualityScore?: number
  glowScore?: number
}

export interface FilterState {
  treatmentTypes: string[]
  goals: string[]
  distanceMiles: number
  minRating: number
  priceTiers: string[]
  verifiedOnly: boolean
  onlineBooking: boolean
  telehealth: boolean
  membershipPlans: boolean
  freeConsultation: boolean
}
