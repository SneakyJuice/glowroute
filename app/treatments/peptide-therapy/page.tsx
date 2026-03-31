import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClinicCard from '@/components/ClinicCard'
import { fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'
import { SITE_URL } from '@/lib/config'
import { GOALS, type GoalDef } from '@/lib/goals'
import type { Clinic } from '@/types/clinic'

export const revalidate = 3600 // ISR — 1 hour

export const metadata: Metadata = {
  title: 'Peptide Therapy Clinics Near You — GlowRoute',
  description: 'Find verified peptide therapy clinics offering BPC-157, sermorelin, semaglutide, TRT, NAD+, and hormone optimization. Compare clinics, read reviews, book consultations.',
  keywords: 'peptide therapy, BPC-157, sermorelin, semaglutide, TRT, hormone optimization, NAD+ therapy, peptide clinic near me',
  alternates: { canonical: `${SITE_URL}/treatments/peptide-therapy` },
  openGraph: {
    title: 'Peptide Therapy Clinics Near You — GlowRoute',
    description: 'Find verified peptide therapy clinics near you. BPC-157, TRT, GLP-1, sermorelin, NAD+ and more.',
    url: `${SITE_URL}/treatments/peptide-therapy`,
    type: 'website',
    siteName: 'GlowRoute',
  },
}

// Peptide goal tabs — ordered by search volume / patient relevance
const PEPTIDE_GOALS: { slug: string; label: string; emoji: string; tagline: string; peptides: string[] }[] = [
  {
    slug: 'all',
    label: 'All Peptide',
    emoji: '🧬',
    tagline: 'All peptide therapy providers',
    peptides: [],
  },
  {
    slug: 'weight-metabolic',
    label: 'Weight & GLP-1',
    emoji: '⚖️',
    tagline: 'Semaglutide, tirzepatide, AOD-9604',
    peptides: ['Semaglutide', 'Tirzepatide', 'AOD-9604'],
  },
  {
    slug: 'anti-aging-longevity',
    label: 'Anti-Aging',
    emoji: '⏳',
    tagline: 'Sermorelin, CJC-1295, NAD+, GHK-Cu',
    peptides: ['Sermorelin', 'CJC-1295', 'Ipamorelin', 'NAD+'],
  },
  {
    slug: 'hormone-balance',
    label: 'Hormone & TRT',
    emoji: '⚗️',
    tagline: 'Testosterone, HRT, hormone optimization',
    peptides: ['Sermorelin', 'Ipamorelin', 'PT-141'],
  },
  {
    slug: 'muscle-performance',
    label: 'Muscle & Performance',
    emoji: '💪',
    tagline: 'Body recomp, growth hormone, sermorelin',
    peptides: ['Sermorelin', 'Ipamorelin', 'CJC-1295'],
  },
  {
    slug: 'recovery-repair',
    label: 'Recovery & Repair',
    emoji: '🔧',
    tagline: 'BPC-157, TB-500 — injury & tissue healing',
    peptides: ['BPC-157', 'TB-500', 'Thymosin Beta-4'],
  },
  {
    slug: 'immune-wellness',
    label: 'Immune & Wellness',
    emoji: '🛡️',
    tagline: 'Thymosin Alpha-1, NAD+, cellular health',
    peptides: ['Thymosin Alpha-1', 'NAD+', 'GHK-Cu'],
  },
  {
    slug: 'cognitive-mood',
    label: 'Cognitive & Mood',
    emoji: '🧠',
    tagline: 'Selank, Semax, PT-141, NAD+',
    peptides: ['Selank', 'Semax', 'PT-141'],
  },
]

// The 14 Cat-1 reclassified peptides (RFK Jr. Feb 27, 2026)
const CAT1_PEPTIDES = [
  { name: 'BPC-157', goal: 'Recovery & Repair', status: 'cat1' },
  { name: 'TB-500', goal: 'Recovery & Repair', status: 'cat1' },
  { name: 'Sermorelin', goal: 'Anti-Aging / Muscle', status: 'cat1' },
  { name: 'Ipamorelin', goal: 'Anti-Aging / Muscle', status: 'cat1' },
  { name: 'CJC-1295', goal: 'Anti-Aging / Muscle', status: 'cat1' },
  { name: 'AOD-9604', goal: 'Weight Loss', status: 'cat1' },
  { name: 'Selank', goal: 'Cognitive', status: 'cat1' },
  { name: 'Semax', goal: 'Cognitive', status: 'cat1' },
  { name: 'GHK-Cu', goal: 'Skin / Immune', status: 'cat1' },
  { name: 'Thymosin Alpha-1', goal: 'Immune', status: 'cat1' },
  { name: 'Thymosin Beta-4', goal: 'Recovery', status: 'cat1' },
  { name: 'Tesamorelin', goal: 'Anti-Aging / Muscle', status: 'cat1' },
  { name: 'PT-141', goal: 'Cognitive / Libido', status: 'cat1' },
  { name: 'NAD+', goal: 'Longevity / Energy', status: 'cat1' },
]

function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function isPeptideClinic(clinic: Clinic): boolean {
  const goals = clinic.goals || []
  return goals.some(g => [
    'recovery-repair', 'anti-aging-longevity', 'hormone-balance',
    'muscle-performance', 'immune-wellness', 'cognitive-mood', 'weight-metabolic',
  ].includes(g))
}

function clinicsForGoal(clinics: Clinic[], goalSlug: string): Clinic[] {
  if (goalSlug === 'all') return clinics
  return clinics.filter(c => (c.goals || []).includes(goalSlug))
}

export default async function PeptideTherapyPage({
  searchParams,
}: {
  searchParams: { goal?: string; city?: string }
}) {
  const allClinics = await fetchAllClinicsFromSupabase()
  const activeGoalSlug = searchParams.goal || 'all'
  const cityFilter = searchParams.city

  // Filter to peptide-relevant clinics
  const peptideClinics = allClinics
    .filter(isPeptideClinic)
    .filter(c => c.googleRating >= 4.0)
    .sort((a, b) => b.googleReviewCount - a.googleReviewCount || b.googleRating - a.googleRating)

  // Apply tab filter
  let displayed = clinicsForGoal(peptideClinics, activeGoalSlug)

  // Apply city filter if present
  if (cityFilter) {
    displayed = displayed.filter(c => citySlug(c.city) === cityFilter)
  }

  // City breakdown (top cities across all peptide clinics)
  const cityMap: Record<string, number> = {}
  peptideClinics.forEach(c => { cityMap[c.city] = (cityMap[c.city] ?? 0) + 1 })
  const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const activeTab = PEPTIDE_GOALS.find(g => g.slug === activeGoalSlug) || PEPTIDE_GOALS[0]
  const displayCount = displayed.length
  const showCount = Math.min(24, displayCount)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalTherapy',
    name: 'Peptide Therapy',
    description: 'Peptide therapy including BPC-157, TB-500, sermorelin, semaglutide, NAD+, and hormone optimization at verified medical spas and wellness clinics.',
    relevantSpecialty: { '@type': 'MedicalSpecialty', name: 'Endocrinology' },
    recognizingAuthority: { '@type': 'Organization', name: 'GlowRoute', url: SITE_URL },
    legalStatus: '14 peptides reclassified to FDA Category 1 (compounding allowed) — February 2026',
  }

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-onyx text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/treatments" className="hover:text-white transition-colors">Treatments</Link>
            <span>/</span>
            <span className="text-white/80">Peptide Therapy</span>
          </nav>

          <div className="flex flex-wrap items-start gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🧬</span>
                <span className="bg-sage/20 text-sage border border-sage/30 text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  14 Peptides Now Cat-1 ✓
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
                Find Peptide Therapy Clinics
                {cityFilter ? ` in ${cityFilter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}` : ' Near You'}
              </h1>
            </div>
          </div>

          <p className="text-white/65 text-base leading-relaxed max-w-2xl mb-6">
            {peptideClinics.length.toLocaleString()} verified providers offering peptide therapy, TRT, hormone optimization &amp; GLP-1 weight loss.
            Filter by health goal to find the right clinic for your protocol.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-8">
            {[
              { label: 'Verified Providers', value: peptideClinics.length.toLocaleString() },
              { label: 'Top City', value: topCities[0]?.[0] ?? 'Tampa' },
              { label: 'Goal Categories', value: '7 Specialties' },
              { label: 'Legal Status', value: '14 Peptides Cat-1' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance Notice ─────────────────────────────────────────── */}
      <div className="bg-sage/5 border-b border-sage/15 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-start gap-2.5 text-[13px] text-stone">
          <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>
            <strong className="text-onyx">February 2026:</strong> RFK Jr. announced FDA reclassification of 14 peptides from Category 2 → Category 1 (compounding legal with Rx).
            Formal FDA publication pending Q2 2026. GlowRoute surfaces <strong>compliant-first</strong> clinics. {' '}
            <Link href="/articles/14-peptides-update" className="text-sage hover:underline">Learn more →</Link>
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Goal Tabs ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Filter by Health Goal</p>
          <div className="flex flex-wrap gap-2">
            {PEPTIDE_GOALS.map(tab => {
              const isActive = tab.slug === activeGoalSlug
              const count = tab.slug === 'all' ? peptideClinics.length : clinicsForGoal(peptideClinics, tab.slug).length
              return (
                <Link
                  key={tab.slug}
                  href={`/treatments/peptide-therapy${tab.slug !== 'all' ? `?goal=${tab.slug}` : ''}`}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-onyx text-white border-onyx shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-sage/50 hover:text-sage hover:bg-sage/5'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span className={`text-[11px] font-bold ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
          {activeGoalSlug !== 'all' && activeTab.peptides.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[11px] text-gray-400 font-medium">Key peptides:</span>
              {activeTab.peptides.map(p => (
                <span key={p} className="text-[11px] font-semibold bg-sage/10 text-sage px-2 py-0.5 rounded-full border border-sage/20">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── City Quick-Filter ────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest self-center mr-1">By City:</span>
          <Link
            href={`/treatments/peptide-therapy${activeGoalSlug !== 'all' ? `?goal=${activeGoalSlug}` : ''}`}
            className={`text-[12px] px-2.5 py-1 rounded-full border transition-all ${
              !cityFilter ? 'bg-sage text-white border-sage' : 'bg-white text-gray-600 border-gray-200 hover:border-sage/50'
            }`}
          >
            All Cities
          </Link>
          {topCities.map(([city, count]) => (
            <Link
              key={city}
              href={`/treatments/peptide-therapy?${activeGoalSlug !== 'all' ? `goal=${activeGoalSlug}&` : ''}city=${citySlug(city)}`}
              className={`text-[12px] px-2.5 py-1 rounded-full border transition-all ${
                cityFilter === citySlug(city)
                  ? 'bg-sage text-white border-sage'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sage/50'
              }`}
            >
              {city} <span className="text-[10px] opacity-60">{count}</span>
            </Link>
          ))}
        </div>

        {/* ── Results Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-stone">
            Showing <strong className="text-onyx">{Math.min(showCount, displayCount)}</strong> of{' '}
            <strong className="text-onyx">{displayCount.toLocaleString()}</strong> {activeTab.label.toLowerCase()} clinics
            {cityFilter ? ` in ${cityFilter.replace(/-/g, ' ')}` : ''}
          </p>
          <Link href="/clinics?goal=recovery-repair" className="text-[12px] text-sage hover:underline font-medium">
            Advanced filter →
          </Link>
        </div>

        {/* ── Clinic Grid ──────────────────────────────────────────────── */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 text-stone">
            <p className="text-4xl mb-3">🧬</p>
            <p className="font-semibold text-onyx mb-1">No clinics found</p>
            <p className="text-sm">Try a different goal or city filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {displayed.slice(0, showCount).map(clinic => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
        )}

        {displayCount > showCount && (
          <div className="text-center mb-10">
            <Link
              href={`/clinics?goal=${activeGoalSlug !== 'all' ? activeGoalSlug : 'recovery-repair'}${cityFilter ? `&city=${cityFilter}` : ''}`}
              className="inline-block bg-onyx text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-sage transition-colors"
            >
              View All {displayCount.toLocaleString()} Clinics →
            </Link>
          </div>
        )}

        {/* ── Cat-1 Peptide Reference ───────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧬</span>
            <h2 className="font-serif text-xl font-semibold text-onyx">14 Reclassified Peptides (Cat-1)</h2>
            <span className="bg-sage/10 text-sage text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-sage/20 ml-auto">
              Feb 2026
            </span>
          </div>
          <p className="text-sm text-stone mb-4">
            These compounds are expected to return to Category 1 status — meaning licensed 503A compounding pharmacies can prepare them with a physician&apos;s prescription.
            Formal FDA publication pending Q2 2026.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CAT1_PEPTIDES.map(p => (
              <div key={p.name} className="flex items-center gap-2 bg-ivory rounded-lg px-3 py-2 border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-onyx">{p.name}</p>
                  <p className="text-[10px] text-stone">{p.goal}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-4">
            ⚠️ Not FDA-approved drugs. Category 1 = compounding legal with valid Rx. Not the same as proven efficacy. Always consult a licensed physician.
          </p>
        </section>

        {/* ── Top Cities ───────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-onyx mb-4">Peptide Therapy by City</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {topCities.map(([city, count]) => (
              <Link
                key={city}
                href={`/treatments/peptide-therapy?city=${citySlug(city)}`}
                className="bg-white rounded-xl border border-gray-200 p-3.5 hover:border-sage/40 hover:shadow-sm transition-all group"
              >
                <p className="text-sm font-semibold text-onyx group-hover:text-sage transition-colors">{city}</p>
                <p className="text-[11px] text-stone mt-0.5">{count} clinics</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── SEO Content Block ─────────────────────────────────────────── */}
        <section className="prose prose-sm max-w-none text-stone">
          <h2 className="font-serif text-xl font-semibold text-onyx not-prose mb-3">
            What Is Peptide Therapy?
          </h2>
          <p>
            Peptide therapy uses short chains of amino acids — called peptides — to signal specific biological responses in the body.
            Unlike pharmaceutical drugs, peptides mimic or amplify the body&apos;s own signaling molecules. Depending on the compound, they can
            stimulate tissue repair, optimize hormone levels, support immune function, enhance cognitive clarity, or accelerate fat metabolism.
          </p>
          <p className="mt-3">
            The most sought-after peptides — BPC-157 for injury recovery, sermorelin for growth hormone optimization, semaglutide for metabolic health,
            and NAD+ for cellular energy — are now available through licensed 503A compounding pharmacies following the February 2026 FDA reclassification.
          </p>
          <p className="mt-3">
            GlowRoute surfaces clinics offering physician-supervised peptide protocols across Florida, Texas, Arizona, Georgia, and beyond.
            Every clinic in our directory has been verified for location, contact information, and service offerings.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  )
}
