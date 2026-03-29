import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { getSupabaseAdmin } from '@/lib/supabase'
import { mapSupabaseRow, clean, fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'
import type { Clinic } from '@/types/clinic'
import TreatmentTag, { getTagVariant } from '@/components/TreatmentTag'
import VerifiedBadge from '@/components/VerifiedBadge'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LeadCaptureForm from '@/components/LeadCaptureForm'
import AvailabilityBadge from '@/components/AvailabilityBadge'
import CreatorBadge from '@/components/CreatorBadge'
import { SITE_URL } from '@/lib/config'
import { getVibeTags, detectBookingPlatform, VIBE_STYLES } from '@/lib/vibes'
import type { VibeTag } from '@/lib/vibes'
import { detectInfluencer, getInfluencerTier } from '@/lib/influencer'
import { calculateGlowScore } from '@/lib/glowscore'
import { GlowScoreProfileCard } from '@/components/GlowScoreBadge'

/** Normalize a city name to a URL-safe slug */
function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

interface PageProps {
  params: { city: string; slug: string }
}

// Helper to fetch a single clinic from Supabase
async function fetchClinicBySlug(city: string, slug: string): Promise<Clinic | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .limit(1)
  if (error || !data || data.length === 0) return null
  return clean(mapSupabaseRow(data[0]))
}

export async function generateStaticParams() {
  const all = await fetchAllClinicsFromSupabase()
  return all.map(clinic => ({
    city: citySlug(clinic.city),
    slug: clinic.slug,
  }))
}

/** Truncate a string to maxLen, appending suffix if cut */
function truncate(str: string, maxLen: number, suffix = '…'): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - suffix.length).trimEnd() + suffix
}

export async function generateMetadata({ params }: PageProps) {
  const clinic = await fetchClinicBySlug(params.city, params.slug)
  if (!clinic) return { title: 'Clinic Not Found | GlowRoute' }

  // Page title: full name (browsers handle overflow)
  const pageTitle = `${clinic.name} | GlowRoute`
  // OG title: max 70 chars for social share previews
  const ogTitle = `${truncate(clinic.name, 55)} | GlowRoute`

  const description = truncate(
    clinic.description ||
      `Discover ${clinic.name} in ${clinic.city}, FL — ${(clinic.treatments || []).slice(0, 3).join(', ')}. Book a consultation today.`,
    160
  )

  const image =
    clinic.images?.[0] ||
    (clinic as any).imageUrl ||
    clinic.logo ||
    `${SITE_URL}/og-default.jpg`

  const pageUrl = `${SITE_URL}/clinics/${params.city}/${params.slug}`

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: ogTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: truncate(clinic.name, 100) }],
      type: 'website',
      url: pageUrl,
      siteName: 'GlowRoute',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [image],
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`text-lg ${
            i <= Math.floor(rating)
              ? 'text-gold'
              : i - 0.5 <= rating
              ? 'text-gold opacity-50'
              : 'text-gray-200'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default async function ClinicProfilePage({ params }: PageProps) {
  const clinic = await fetchClinicBySlug(params.city, params.slug)
  if (!clinic) notFound()

  const allTreatments = [
    ...(clinic.treatments || []),
    ...(clinic.specialtyTreatments || []),
  ].filter((t, idx, arr) => arr.indexOf(t) === idx)

  const primaryImage = clinic.images?.[0] || null
  const galleryImages = clinic.images?.slice(1) || []

  const googleMapsUrl =
    clinic.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      clinic.name + ' ' + (clinic.address || clinic.city)
    )}`

  const isUnclaimed = !clinic.verified

  const pageUrl = `${SITE_URL}/clinics/${citySlug(clinic.city)}/${clinic.slug}`
  const socialProfiles: string[] = []
  if (clinic.instagramHandle) {
    socialProfiles.push(`https://instagram.com/${clinic.instagramHandle.replace('@', '')}`)
  }
  if (clinic.tiktokHandle) {
    socialProfiles.push(`https://www.tiktok.com/@${clinic.tiktokHandle.replace('@', '')}`)
  }

  const sameAs = new Set<string>()
  socialProfiles.forEach(url => sameAs.add(url))
  if (clinic.website) sameAs.add(clinic.website)
  if (clinic.bookingUrl) sameAs.add(clinic.bookingUrl)

  const clinicSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': pageUrl,
    url: pageUrl,
    name: clinic.name,
    description: clinic.description,
    medicalSpecialty: 'MedicalSpa',
  }

  const schemaImage = primaryImage || clinic.logo || clinic.images?.[0]
  if (schemaImage) clinicSchema.image = schemaImage
  if (clinic.phone) clinicSchema.telephone = clinic.phone
  if (clinic.priceTier) clinicSchema.priceRange = clinic.priceTier
  if (sameAs.size) clinicSchema.sameAs = Array.from(sameAs)

  if (clinic.address || clinic.city || clinic.state) {
    clinicSchema.address = {
      '@type': 'PostalAddress',
      ...(clinic.address ? { streetAddress: clinic.address } : {}),
      ...(clinic.city ? { addressLocality: clinic.city } : {}),
      ...(clinic.state ? { addressRegion: clinic.state } : {}),
      addressCountry: 'US',
    }
  }

  if (clinic.lat && clinic.lng) {
    clinicSchema.geo = {
      '@type': 'GeoCoordinates',
      latitude: clinic.lat,
      longitude: clinic.lng,
    }
  }

  if (clinic.googleRating && clinic.googleReviewCount) {
    clinicSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: clinic.googleRating,
      reviewCount: clinic.googleReviewCount,
      bestRating: 5,
    }
  }

  if (allTreatments.length) {
    clinicSchema.availableService = allTreatments.map(t => ({
      '@type': 'MedicalProcedure',
      name: t,
    }))
  }

  if (clinic.mapsUrl) {
    clinicSchema.hasMap = clinic.mapsUrl
  }

  // Creator / influencer signals
  const isCreator = detectInfluencer(clinic)
  const creatorTier = isCreator ? getInfluencerTier(clinic) : null

  // GlowScore
  const glowScore = calculateGlowScore(clinic)

  // Vibe tags + booking platform
  const vibeTags = getVibeTags(clinic)
  const bookingPlatform = detectBookingPlatform(clinic)

  // Book Now URL — bookingUrl first, then website if it's a booking platform
  const bookNowUrl = bookingPlatform?.url ?? null

  // Nearby clinics in same city
  const nearbyClinics: import('@/types/clinic').Clinic[] = [] // Supabase query TBD

  return (
    <div className="min-h-screen bg-[#F8F6F1] font-sans">
      <Navbar />

      <Script
        id={`clinic-schema-${clinic.slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicSchema) }}
      />

      {/* Hero Image Banner */}
      <div className="w-full h-[260px] md:h-[340px] relative overflow-hidden bg-gradient-to-br from-[#0D1B2E] to-[#1a2e4a]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={clinic.name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : clinic.logo ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={clinic.logo}
              alt={clinic.name}
              className="max-h-[120px] max-w-[60%] object-contain opacity-60"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl opacity-30">✨</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2E]/80 via-transparent to-transparent" />
        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 md:left-8">
          <Link
            href="/clinics"
            className="text-white/70 text-xs hover:text-white transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Directory
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">

            {/* Clinic Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                {/* Logo */}
                {clinic.logo && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                    <img
                      src={clinic.logo}
                      alt={`${clinic.name} logo`}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {clinic.verified && <VerifiedBadge className="static" />}
                    {clinic.featured && (
                      <span className="bg-gold text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                    {isUnclaimed && (
                      <span className="bg-gray-100 text-gray-400 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border border-gray-200">
                        Unclaimed
                      </span>
                    )}
                    {isCreator && creatorTier && (
                      <CreatorBadge tier={creatorTier} variant="card" instagramUrl={(clinic as any).instagram} />
                    )}
                    {clinic.instagramHandle && (
                      <a
                        href={`https://instagram.com/${clinic.instagramHandle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 text-pink-600 hover:border-pink-400 transition-colors"
                        title="View on Instagram"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        @{clinic.instagramHandle.replace('@', '')}
                      </a>
                    )}
                    {clinic.tiktokHandle && (
                      <a
                        href={`https://tiktok.com/@${clinic.tiktokHandle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                        title="View on TikTok"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.81 1.54V6.78a4.85 4.85 0 01-1.04-.09z"/></svg>
                        @{clinic.tiktokHandle.replace('@', '')}
                      </a>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-navy leading-tight">{clinic.name}</h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StarRating rating={clinic.googleRating} />
                    <span className="font-bold text-navy">{clinic.googleRating}</span>
                    <span className="text-sm text-gray-400">
                      ({clinic.googleReviewCount.toLocaleString()} Google reviews)
                    </span>
                  </div>
                  {clinic.address && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 mt-2 text-sm text-gray-500 hover:text-teal transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {clinic.address}
                      <svg
                        className="w-3 h-3 ml-0.5 opacity-50"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  )}
                  {/* Vibe tags */}
                  {vibeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {vibeTags.map(tag => (
                        <span
                          key={tag}
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${VIBE_STYLES[tag as VibeTag] ?? 'bg-gray-100 border-gray-200 text-gray-600'}`}
                        >
                          {tag}
                        </span>
                      ))}
                      {/* Booking platform badge */}
                      {bookingPlatform && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-green-50 border-green-200 text-green-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {bookingPlatform.label}
                        </span>
                      )}
                    </div>
                  )}
                  {clinic.availability && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-teal-light animate-pulse" />
                      <span className="text-sm text-teal font-medium">{clinic.availability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons — Book Now prominently above fold */}
              <div className="flex flex-wrap gap-2.5 mt-5">
                {/* Book Now — primary CTA when booking available */}
                {bookNowUrl ? (
                  <a
                    href={bookNowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                    {bookingPlatform?.platform === 'generic' ? 'Book Online' : `Book Now`}
                  </a>
                ) : (
                  <a
                    href="#lead-form"
                    className="flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Request Appointment
                  </a>
                )}
                {clinic.phone && (
                  <a
                    href={`tel:${clinic.phone}`}
                    className="flex items-center gap-2 bg-teal text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-navy transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0111.41 18 19.5 19.5 0 015 11.59a19.79 19.79 0 01-3.89-8.3A2 2 0 013.09 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16z" />
                    </svg>
                    {clinic.phone}
                  </a>
                )}
                {clinic.website && (
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-teal/30 text-teal text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-teal/5 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                    Visit Website
                  </a>
                )}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-teal/30 hover:text-teal transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Get Directions
                </a>
              </div>
              <div className="mt-3">
                <AvailabilityBadge icalUrl={clinic.icalUrl} bookingUrl={clinic.bookingUrl} />
              </div>
            </div>

            {/* About */}
            {clinic.description && clinic.description.length > 40 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-navy mb-3">About This Clinic</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{clinic.description}</p>
                {clinic.brandValues && clinic.brandValues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {clinic.brandValues.map(val => (
                      <span
                        key={val}
                        className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full capitalize"
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Services / Treatments */}
            {allTreatments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-navy mb-3">Treatments & Services</h2>
                <div className="flex flex-wrap gap-2">
                  {allTreatments.map(t => (
                    <TreatmentTag key={t} label={t} variant={getTagVariant(t)} />
                  ))}
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {galleryImages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-navy mb-3">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {galleryImages.map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={img}
                        alt={`${clinic.name} photo ${i + 2}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-4">

            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-navy mb-3">Clinic Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">City</span>
                  <span className="font-medium text-navy">{clinic.city}</span>
                </div>
                {clinic.neighborhood && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Neighborhood</span>
                    <span className="font-medium text-navy">{clinic.neighborhood}</span>
                  </div>
                )}
                {clinic.priceTier && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Price Range</span>
                    <span className="font-bold text-navy">{clinic.priceTier}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Google Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gold">★</span>
                    <span className="font-bold text-navy">{clinic.googleRating}</span>
                    <span className="text-gray-400 text-xs">({clinic.googleReviewCount.toLocaleString()})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      clinic.verified
                        ? 'bg-teal/10 text-teal'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {clinic.verified ? '✓ Verified' : 'Unverified'}
                  </span>
                </div>
                {isUnclaimed && (
                  <div className="pt-2 border-t border-gray-100">
                    <a
                      href={`/claim/${clinic.slug}`}
                      className="text-xs font-semibold text-teal hover:underline"
                    >
                      Own this business? Claim your listing →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* GlowScore™ sidebar card */}
            <GlowScoreProfileCard
              score={glowScore}
              clinicSlug={clinic.slug}
              isUnclaimed={isUnclaimed}
            />

            {/* Creator Clinic badge — profile variant */}
            {isCreator && creatorTier && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-navy mb-3">Social Presence</h3>
                <CreatorBadge
                  tier={creatorTier}
                  variant="profile"
                  instagramUrl={(clinic as any).instagram}
                />
              </div>
            )}

            {/* Price Range */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-navy mb-3">Pricing</h3>
              {clinic.priceTier ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Price Range</span>
                  <span className="font-bold text-navy text-lg">{clinic.priceTier}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Contact for Pricing</p>
              )}
            </div>

            {/* Claim This Listing CTA */}
            {isUnclaimed && (
              <div className="bg-navy rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_120%,rgba(2,192,154,0.2),transparent)] pointer-events-none" />
                <div className="text-xl mb-1.5 relative">🏢</div>
                <h3 className="text-white font-bold text-sm mb-1.5 relative">Is this your clinic?</h3>
                <p className="text-white/60 text-xs mb-4 relative leading-relaxed">
                  430+ patients searched your area last month. Claim your listing to capture leads.
                </p>
                <a
                  href={`/claim/${clinic.slug}`}
                  className="block text-center bg-teal text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal/80 transition-colors relative"
                >
                  Claim This Listing →
                </a>
              </div>
            )}

            {/* Lead Capture Form */}
            <LeadCaptureForm
              clinicName={clinic.name}
              clinicSlug={clinic.slug}
              treatments={allTreatments}
            />

            {/* Nearby Clinics (same city) */}
            {nearbyClinics.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-navy mb-3">More in {clinic.city}</h3>
                <div className="space-y-3">
                  {nearbyClinics.map(nearby => (
                    <Link
                      key={nearby.slug}
                      href={`/clinics/${citySlug(nearby.city)}/${nearby.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {nearby.logo ? (
                          <img
                            src={nearby.logo}
                            alt={nearby.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-lg">✨</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-navy group-hover:text-teal transition-colors line-clamp-1">
                          {nearby.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-gold text-[10px]">★</span>
                          <span className="text-[10px] text-gray-500">
                            {nearby.googleRating} ({nearby.googleReviewCount.toLocaleString()})
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/clinics?city=${encodeURIComponent(clinic.city)}`}
                  className="block text-center text-xs font-semibold text-teal mt-4 hover:underline"
                >
                  View all {clinic.city} clinics →
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
