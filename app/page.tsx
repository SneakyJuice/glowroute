import { Metadata } from 'next'
import { fetchAllClinicsFromSupabase, fetchFeaturedClinic } from '@/data/supabase-clinics'
import { calculateGlowScore } from '@/lib/glowscore'
import { Clinic } from '@/types/clinic'
import ClinicsClient from '@/app/clinics/ClinicsClient'

export const metadata: Metadata = {
  title: 'GlowRoute — Find Top-Rated Med Spas & Aesthetic Clinics in Florida',
  description: 'Discover and compare 4,000+ med spas and aesthetic clinics across Florida. Filter by treatment, city, and ratings. Powered by GlowScore™.',
}

const SSR_PAGE_SIZE = 20

function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** Lightweight server-rendered clinic card — pure HTML, no interactivity needed */
function SSRClinicCard({ clinic }: { clinic: Clinic }) {
  const score = calculateGlowScore(clinic)
  const profileUrl = `/clinics/${citySlug(clinic.city)}/${clinic.slug}`
  const treatments = clinic.treatments.slice(0, 4)

  return (
    <article className="bg-white rounded-2xl overflow-hidden flex flex-col border border-gray-200 shadow-sm">
      <div className="h-[168px] relative overflow-hidden bg-gradient-to-br from-[#c9d8e8] to-[#e0eff7]">
        {(clinic.imageUrl || clinic.images?.[0]) ? (
          <img
            src={clinic.imageUrl || clinic.images?.[0]}
            alt={clinic.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : clinic.logo ? (
          <img src={clinic.logo} alt={clinic.name} className="w-full h-full object-contain p-8" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🏥</div>
        )}
        {clinic.verified && (
          <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-sage text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-sage/20">✓ Verified</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <h3 className="text-[15px] font-bold text-onyx tracking-tight leading-snug">
          <a href={profileUrl} className="hover:text-sage transition-colors">{clinic.name}</a>
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`text-[13px] ${i <= Math.floor(clinic.googleRating) ? 'text-champagne' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
          <span className="text-sm font-bold text-onyx">{clinic.googleRating}</span>
          <span className="text-xs text-gray-400">({clinic.googleReviewCount})</span>
        </div>
        {(clinic.neighborhood || clinic.city) && (
          <p className="text-xs text-gray-500">
            📍 {clinic.neighborhood || clinic.city}{clinic.distance && ` · ${clinic.distance}`}
          </p>
        )}
        {treatments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {treatments.map(t => (
              <span key={t} className="text-[11px] font-medium text-stone bg-stone/10 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
        {clinic.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{clinic.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
        <a href={profileUrl} className="flex-1 text-center text-sm font-semibold text-white bg-sage px-3.5 py-2 rounded hover:bg-onyx transition-colors">
          View Profile
        </a>
        <span className="text-xs font-semibold text-champagne">{score.total}/100 GlowScore</span>
      </div>
    </article>
  )
}

/** Server-rendered featured clinic card */
function SSRFeaturedCard({ clinic }: { clinic: Clinic }) {
  const profileUrl = `/clinics/${citySlug(clinic.city)}/${clinic.slug}`
  return (
    <article className="col-span-full">
      <div className="bg-white rounded-2xl border border-champagne/35 shadow-featured overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr]">
        <div className="h-[220px] bg-gradient-to-br from-[#bdd4e7] to-[#d4ecf5] flex items-center justify-center text-5xl">
          {(clinic.imageUrl || clinic.images?.[0]) ? (
            <img src={clinic.imageUrl || clinic.images?.[0]} alt={clinic.name} className="w-full h-full object-cover" />
          ) : clinic.logo ? (
            <img src={clinic.logo} alt={clinic.name} className="max-w-[60%] max-h-[60%] object-contain opacity-80" />
          ) : '✨'}
        </div>
        <div className="p-5 flex flex-col gap-2.5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-white/95 backdrop-blur-sm text-sage text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-sage/20">✓ Verified</span>
              <span className="bg-champagne text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">⭐ Featured</span>
            </div>
            <h3 className="text-lg font-bold text-onyx tracking-tight">
              <a href={profileUrl} className="hover:text-sage transition-colors">{clinic.name}</a>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <span key={i} className={`text-[13px] ${i <= Math.floor(clinic.googleRating) ? 'text-champagne' : 'text-gray-200'}`}>★</span>
              ))}
            </div>
            <span className="text-sm font-bold text-onyx">{clinic.googleRating}</span>
            <span className="text-xs text-gray-400">({clinic.googleReviewCount} reviews)</span>
          </div>
          {clinic.address && (
            <p className="text-xs text-gray-500">📍 {clinic.address}{clinic.distance && ` · ${clinic.distance} away`}</p>
          )}
          {clinic.description && <p className="text-sm text-gray-500 leading-relaxed">{clinic.description}</p>}
          <div className="flex items-center gap-2.5 mt-auto">
            <a href={profileUrl} className="inline-block bg-sage text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-onyx transition-colors">View Full Profile</a>
          </div>
        </div>
      </div>
    </article>
  )
}

export default async function HomePage() {
  const allClinicsRaw = await fetchAllClinicsFromSupabase()
  const allClinics = allClinicsRaw.filter(c => c.city && c.slug)
  const initialFeaturedClinic = await fetchFeaturedClinic()

  const getInitialClinics = () => {
    if (!initialFeaturedClinic) return allClinics.slice(0, SSR_PAGE_SIZE)
    return allClinics
      .filter(c => c.id !== initialFeaturedClinic.id && (c.googleRating ?? 0) > 1)
      .sort((a, b) => calculateGlowScore(b).total - calculateGlowScore(a).total)
      .slice(0, SSR_PAGE_SIZE)
  }

  const initialClinics = getInitialClinics()
  const totalCount = allClinics.length

  return (
    <>
      {/* ── SSR Preview: visible to crawlers, hidden once client JS mounts ── */}
      <div id="ssr-clinic-preview" className="min-h-screen bg-ivory font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-onyx tracking-tight">
              Find Top-Rated Med Spas &amp; Aesthetic Clinics in Florida
            </h1>
            <p className="text-stone mt-2">
              Discover and compare {totalCount.toLocaleString()} med spas and aesthetic clinics.
              Sorted by GlowScore™ — our proprietary quality ranking.
            </p>
          </header>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {initialFeaturedClinic && (initialFeaturedClinic.googleRating ?? 0) > 0 && (initialFeaturedClinic.googleReviewCount ?? 0) > 0 && <SSRFeaturedCard clinic={initialFeaturedClinic} />}
            {initialClinics.map(clinic => (
              <SSRClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>

          <nav className="mt-8 text-center text-sm text-stone" aria-label="Pagination hint">
            Showing top {initialClinics.length} of {totalCount.toLocaleString()} clinics · Loading full interactive experience…
          </nav>
        </div>
      </div>

      {/* ── Client component: hydrates and replaces the SSR preview ── */}
      <ClinicsClient allClinics={allClinics} initialClinics={initialClinics} featuredClinic={initialFeaturedClinic} />
    </>
  )
}
