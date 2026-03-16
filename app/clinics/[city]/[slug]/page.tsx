import { notFound } from 'next/navigation'
import Link from 'next/link'
import { allClinics } from '@/data/all-clinics'
import TreatmentTag, { getTagVariant } from '@/components/TreatmentTag'
import VerifiedBadge from '@/components/VerifiedBadge'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LeadCaptureForm from '@/components/LeadCaptureForm'

/** Normalize a city name to a URL-safe slug */
function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

interface PageProps {
  params: { city: string; slug: string }
}

export async function generateStaticParams() {
  return allClinics.map(clinic => ({
    city: citySlug(clinic.city),
    slug: clinic.slug,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const clinic = allClinics.find(
    c => c.slug === params.slug && citySlug(c.city) === params.city
  )
  if (!clinic) return { title: 'Clinic Not Found | GlowRoute' }

  const title = `${clinic.name} | GlowRoute`
  const description =
    clinic.description ||
    `Discover ${clinic.name} in ${clinic.city}, FL — ${(clinic.treatments || []).slice(0, 3).join(', ')}. Book a consultation today.`
  const image =
    clinic.images?.[0] ||
    (clinic as any).imageUrl ||
    clinic.logo ||
    'https://glowroute.io/og-default.jpg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: clinic.name }],
      type: 'website',
      url: `https://glowroute.io/clinics/${params.city}/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
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

export default function ClinicProfilePage({ params }: PageProps) {
  const clinic = allClinics.find(c => c.slug === params.slug)
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

  // Nearby clinics in same city
  const nearbyClinics = allClinics
    .filter(c => c.city === clinic.city && c.slug !== clinic.slug)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-[#F8F6F1] font-sans">
      <Navbar />

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
                  {clinic.availability && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-teal-light animate-pulse" />
                      <span className="text-sm text-teal font-medium">{clinic.availability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 mt-5">
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
                {clinic.bookingUrl && (
                  <a
                    href={clinic.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-teal/[0.08] border border-teal/20 text-teal text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-teal hover:text-white transition-colors"
                  >
                    Book Consultation
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
              </div>
            </div>

            {/* Claim This Listing CTA */}
            {isUnclaimed && (
              <div className="bg-navy rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_120%,rgba(2,192,154,0.2),transparent)] pointer-events-none" />
                <div className="text-xl mb-1.5 relative">🏢</div>
                <h3 className="text-white font-bold text-sm mb-1.5 relative">Is this your clinic?</h3>
                <p className="text-white/60 text-xs mb-4 relative leading-relaxed">
                  Claim your free listing to update your info, respond to leads, and unlock analytics.
                </p>
                <a
                  href={`/claim?clinic=${encodeURIComponent(clinic.name)}`}
                  className="block text-center bg-teal text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal/80 transition-colors relative"
                >
                  Claim This Listing →
                </a>
              </div>
            )}

            {/* Lead Capture Form */}
            <LeadCaptureForm clinicName={clinic.name} />

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
