'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClinicCard from '@/components/ClinicCard'
import { allClinics } from '@/data/all-clinics'
import { isPeptideClinic, getPeptideCategory, PeptideCategory } from '@/lib/peptide'
import { SITE_URL } from '@/lib/config'

type FilterTab = 'All Peptide' | 'TRT/Testosterone' | 'GLP-1/Semaglutide' | 'BPC-157/Recovery' | 'HGH/IGF-1'

const TAB_MAP: Record<FilterTab, PeptideCategory | null> = {
  'All Peptide': null,
  'TRT/Testosterone': 'TRT',
  'GLP-1/Semaglutide': 'GLP-1',
  'BPC-157/Recovery': 'BPC-157',
  'HGH/IGF-1': 'HGH/IGF-1',
}

const TABS: FilterTab[] = ['All Peptide', 'TRT/Testosterone', 'GLP-1/Semaglutide', 'BPC-157/Recovery', 'HGH/IGF-1']

// schema injected via script tag — only on server, so we pre-compute here
const peptideClinics = allClinics
  .filter(isPeptideClinic)
  .sort((a, b) => b.googleRating - a.googleRating || b.googleReviewCount - a.googleReviewCount)

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalTherapy',
  name: 'Peptide Therapy',
  description: 'Peptide therapy, TRT, hormone optimization, GLP-1 weight loss, and BPC-157 recovery offered at medical spas and wellness clinics.',
  relevantSpecialty: { '@type': 'MedicalSpecialty', name: 'Endocrinology' },
  recognizingAuthority: { '@type': 'Organization', name: 'GlowRoute', url: SITE_URL },
}

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Top Peptide Therapy Clinics near you',
  numberOfItems: Math.min(10, peptideClinics.length),
  itemListElement: peptideClinics.slice(0, 10).map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    url: `${SITE_URL}/clinics/${c.city.toLowerCase().replace(/\s+/g, '-')}/${c.slug}`,
  })),
}

function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function PeptideTherapyPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All Peptide')
  const [page, setPage] = useState(1)
  const PER_PAGE = 12

  const filtered = useMemo(() => {
    const categoryFilter = TAB_MAP[activeTab]
    if (!categoryFilter) return peptideClinics
    return peptideClinics.filter(c => getPeptideCategory(c) === categoryFilter)
  }, [activeTab])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // City breakdown
  const cityMap: Record<string, number> = {}
  peptideClinics.forEach(c => { cityMap[c.city] = (cityMap[c.city] ?? 0) + 1 })
  const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* Hero */}
      <section className="bg-onyx text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/treatments" className="hover:text-white transition-colors">Treatments</Link>
            <span>/</span>
            <span className="text-white/80">Peptide Therapy</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
              Find Peptide Therapy Clinics near you
            </h1>
          </div>
          <p className="text-white/65 text-base leading-relaxed max-w-2xl mb-6">
            {peptideClinics.length} verified providers offering peptide therapy, TRT, hormone optimization &amp; GLP-1 weight loss across the Southeast. Compare clinics, read real reviews, and book your consultation today.
          </p>
          {/* Stats row */}
          <div className="flex flex-wrap gap-6">
            {[
              { label: 'Providers', value: peptideClinics.length.toString() },
              { label: 'Top City', value: topCities[0]?.[0] ?? 'Miami' },
              { label: 'Categories', value: '4 Specialties' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter pills */}
      <div className="sticky top-[60px] z-10 bg-white/95 backdrop-blur border-b border-onyx/8 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1) }}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${
                activeTab === tab
                  ? 'bg-sage text-white border-sage'
                  : 'bg-white text-stone border-onyx/15 hover:border-sage/50 hover:text-sage'
              }`}
            >
              {tab}
              {activeTab !== tab && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({TAB_MAP[tab]
                    ? peptideClinics.filter(c => getPeptideCategory(c) === TAB_MAP[tab]).length
                    : peptideClinics.length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-stone">
            Showing <span className="font-semibold text-onyx">{filtered.length}</span> clinics
            {activeTab !== 'All Peptide' ? ` for ${activeTab}` : ' — all peptide categories'}
          </p>
          <Link href="/clinics" className="text-sm font-semibold text-sage hover:underline">
            Full directory →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {paged.map(clinic => (
            <div key={clinic.slug} className="relative">
              {/* Peptide badge overlay */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage/90 text-white shadow-sm">
                  🧬 {getPeptideCategory(clinic) ?? 'Peptide'}
                </span>
              </div>
              <ClinicCard clinic={clinic} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm font-semibold text-stone px-4 py-2 rounded-lg border border-onyx/10 hover:border-sage/40 hover:text-sage disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-stone px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm font-semibold text-stone px-4 py-2 rounded-lg border border-onyx/10 hover:border-sage/40 hover:text-sage disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* City breakdown */}
        <section className="border-t border-onyx/8 pt-8 mt-4">
          <h2 className="text-base font-bold text-onyx mb-4">Peptide Therapy by City</h2>
          <div className="flex flex-wrap gap-2">
            {topCities.map(([city, n]) => (
              <Link
                key={city}
                href={`/clinics/${citySlug(city)}`}
                className="text-sm font-medium text-stone border border-onyx/10 bg-white px-3 py-1.5 rounded-full hover:border-sage/40 hover:text-sage transition-colors"
              >
                {city} <span className="text-stone/50">({n})</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Related treatments */}
        <section className="border-t border-onyx/8 pt-8 mt-8">
          <h2 className="text-base font-bold text-onyx mb-4">Related Treatments</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { slug: 'trt-testosterone', name: 'TRT & Testosterone' },
              { slug: 'weight-loss-ozempic', name: 'Medical Weight Loss' },
              { slug: 'iv-therapy', name: 'IV Therapy' },
              { slug: 'coolsculpting', name: 'Body Contouring' },
            ].map(t => (
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
