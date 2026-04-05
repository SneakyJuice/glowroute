import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClinicCard from '@/components/ClinicCard'
import { allClinics } from '@/data/all-clinics'
import { SITE_URL } from '@/lib/config'

interface Props { params: { city: string } }

/** city slug → display name (e.g. "miami-beach" → "Miami Beach") */
function citySlugToDisplay(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** clinic.city → URL slug */
function toCitySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** clinic slug → URL slug */
function toClinicSlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function generateStaticParams() {
  const clinics = await allClinics
  const slugs = new Set(clinics.filter(c => c.city).map(c => toCitySlug(c.city)))
  slugs.delete('') // remove empty string from null cities
  return Array.from(slugs).map(city => ({ city }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const clinics = await allClinics
  const displayCity = citySlugToDisplay(params.city)
  const cityClinics = clinics.filter(c => toCitySlug(c.city) === params.city)
  if (cityClinics.length === 0) return { title: 'Clinics — GlowRoute' }

  const count = cityClinics.length
  const title = `Best MedSpas in ${displayCity}, FL — GlowRoute`
  const description = `Discover ${count} verified medical spas and aesthetic clinics in ${displayCity}, FL. Compare services, ratings, and book appointments.`
  const url = `${SITE_URL}/clinics/${params.city}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'GlowRoute',
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CityPage({ params }: Props) {
  const displayCity = citySlugToDisplay(params.city)
  const all = await allClinics
  const cityClinics = all
    .filter(c => toCitySlug(c.city) === params.city)
    .sort((a, b) => b.googleRating - a.googleRating || b.googleReviewCount - a.googleReviewCount)

  if (cityClinics.length === 0) notFound()

  const count = cityClinics.length
  const topClinics = cityClinics.slice(0, 6)
  const avgRating = (cityClinics.reduce((s, c) => s + c.googleRating, 0) / count).toFixed(1)

  // ItemList schema for top 5 clinics
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best MedSpas in ${displayCity}, FL`,
    description: `Top-rated medical spas and aesthetic clinics in ${displayCity}, Florida`,
    url: `${SITE_URL}/clinics/${params.city}`,
    numberOfItems: Math.min(5, cityClinics.length),
    itemListElement: cityClinics.slice(0, 5).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      url: `${SITE_URL}/clinics/${params.city}/${c.slug}`,
      item: {
        '@type': 'LocalBusiness',
        name: c.name,
        address: { '@type': 'PostalAddress', addressLocality: c.city, addressRegion: 'FL', addressCountry: 'US' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: c.googleRating,
          reviewCount: c.googleReviewCount,
        },
      },
    })),
  }

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero */}
      <section className="bg-onyx text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/clinics" className="hover:text-white transition-colors">Clinics</Link>
            <span>/</span>
            <span className="text-white/80">{displayCity}</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">
            Medical Spas in {displayCity}, FL
          </h1>
          <p className="text-white/65 text-base leading-relaxed max-w-2xl mb-5">
            Discover {count} verified medical spas and aesthetic clinics in {displayCity}, Florida.
            Compare services, read real patient reviews, and book your appointment today.
          </p>
          {/* Stats row */}
          <div className="flex flex-wrap gap-6">
            {[
              { label: 'Listings', value: count.toString() },
              { label: 'Avg Rating', value: `★ ${avgRating}` },
              { label: 'City', value: `${displayCity}, FL` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic grid */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-onyx">
            Top-Rated Clinics in {displayCity}
          </h2>
          <Link href="/clinics" className="text-sm font-semibold text-sage hover:underline">
            View all FL clinics →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {topClinics.map(clinic => (
            <ClinicCard key={clinic.slug} clinic={clinic} />
          ))}
        </div>

        {/* Show more if more clinics exist */}
        {cityClinics.length > 6 && (
          <div className="text-center py-6 border-t border-onyx/8">
            <p className="text-stone text-sm mb-3">
              Showing 6 of {cityClinics.length} clinics in {displayCity}
            </p>
            <Link
              href={`/clinics?city=${encodeURIComponent(displayCity)}`}
              className="inline-block bg-sage text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-onyx transition-colors"
            >
              View All {count} Clinics →
            </Link>
          </div>
        )}

        {/* Nearby cities */}
        <section className="mt-12 border-t border-onyx/8 pt-8">
          <h2 className="text-base font-bold text-onyx mb-4">Explore Nearby Cities</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(
              all
                .map(c => c.city)
                .filter(c => c !== cityClinics[0]?.city)
            ))
              .slice(0, 16)
              .map(city => (
                <Link
                  key={city}
                  href={`/clinics/${toCitySlug(city)}`}
                  className="text-sm font-medium text-stone border border-onyx/10 bg-white px-3 py-1.5 rounded-full hover:border-sage/40 hover:text-sage transition-colors"
                >
                  {city}
                </Link>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
