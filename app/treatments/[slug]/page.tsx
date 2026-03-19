import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClinicCard from '@/components/ClinicCard'
import { allClinics } from '@/data/all-clinics'
import { TREATMENTS, getTreatmentBySlug, TREATMENT_SLUGS } from '@/lib/treatments'
import { SITE_URL } from '@/lib/config'
import type { Clinic } from '@/types/clinic'

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  return TREATMENT_SLUGS.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const treatment = getTreatmentBySlug(params.slug)
  if (!treatment) return { title: 'Treatment — GlowRoute' }

  const url = `${SITE_URL}/treatments/${params.slug}`
  return {
    title: treatment.title,
    description: treatment.description,
    keywords: `${treatment.name}, medspa, aesthetic clinic, ${treatment.matchKeywords.slice(0, 4).join(', ')}`,
    alternates: { canonical: url },
    openGraph: {
      title: treatment.title,
      description: treatment.description,
      url,
      type: 'website',
      siteName: 'GlowRoute',
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: treatment.title, description: treatment.description },
  }
}

function matchesTreatment(clinic: Clinic, keywords: string[]): boolean {
  const hay = [
    ...(clinic.treatments ?? []),
    ...(clinic.specialtyTreatments ?? []),
    clinic.description ?? '',
    clinic.name,
  ].join(' ').toLowerCase()
  return keywords.some(k => hay.includes(k.toLowerCase()))
}

export default function TreatmentPage({ params }: Props) {
  const treatment = getTreatmentBySlug(params.slug)
  if (!treatment) notFound()

  const matchingClinics = allClinics
    .filter(c => matchesTreatment(c, treatment.matchKeywords))
    .sort((a, b) => b.googleRating - a.googleRating || b.googleReviewCount - a.googleReviewCount)
    .slice(0, 10)

  // Get city breakdown for context
  const cityCounts: Record<string, number> = {}
  allClinics
    .filter(c => matchesTreatment(c, treatment.matchKeywords))
    .forEach(c => { cityCounts[c.city] = (cityCounts[c.city] ?? 0) + 1 })
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const totalCount = allClinics.filter(c => matchesTreatment(c, treatment.matchKeywords)).length

  // Schema.org markup
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: treatment.schemaName,
    description: treatment.description,
    provider: { '@type': 'Organization', name: 'GlowRoute', url: SITE_URL },
    areaServed: { '@type': 'AdministrativeArea', name: 'Southeast USA' },
    url: `${SITE_URL}/treatments/${params.slug}`,
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Top ${treatment.name} Clinics Near You`,
    numberOfItems: Math.min(10, matchingClinics.length),
    itemListElement: matchingClinics.slice(0, 10).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      url: `${SITE_URL}/clinics/${c.city.toLowerCase().replace(/\s+/g, '-')}/${c.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* Schema markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* Hero */}
      <section className="bg-onyx text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/treatments" className="hover:text-white transition-colors">Treatments</Link>
            <span>/</span>
            <span className="text-white/80">{treatment.name}</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">{treatment.h1}</h1>
          <p className="text-white/65 text-base leading-relaxed max-w-2xl mb-5">{treatment.intro}</p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Matching Clinics</p>
              <p className="text-lg font-bold text-white">{totalCount}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Top City</p>
              <p className="text-lg font-bold text-white">{topCities[0]?.[0] ?? 'Florida'}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Top 10 clinics */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-onyx">Top {treatment.name} Clinics Near You</h2>
          <Link href="/clinics" className="text-sm font-semibold text-sage hover:underline">
            Full directory →
          </Link>
        </div>

        {matchingClinics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {matchingClinics.map(clinic => (
              <ClinicCard key={clinic.slug} clinic={clinic} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-stone">
            <p className="text-sm">No matching clinics found yet.</p>
            <Link href="/clinics" className="text-sage text-sm font-semibold hover:underline mt-2 inline-block">
              Browse all clinics →
            </Link>
          </div>
        )}

        {/* Cities offering this treatment */}
        {topCities.length > 0 && (
          <section className="border-t border-onyx/8 pt-8 mt-4">
            <h2 className="text-base font-bold text-onyx mb-4">
              {treatment.name} by City
            </h2>
            <div className="flex flex-wrap gap-2">
              {topCities.map(([city, n]) => (
                <Link
                  key={city}
                  href={`/clinics/${city.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium text-stone border border-onyx/10 bg-white px-3 py-1.5 rounded-full hover:border-sage/40 hover:text-sage transition-colors"
                >
                  {city} <span className="text-stone/50">({n})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related treatments */}
        <section className="border-t border-onyx/8 pt-8 mt-8">
          <h2 className="text-base font-bold text-onyx mb-4">Explore Other Treatments</h2>
          <div className="flex flex-wrap gap-2">
            {TREATMENTS.filter(t => t.slug !== params.slug).map(t => (
              <Link
                key={t.slug}
                href={`/treatments/${t.slug}`}
                className="text-sm font-medium text-stone border border-onyx/10 bg-white px-3 py-1.5 rounded-full hover:border-sage/40 hover:text-sage transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
