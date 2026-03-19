import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClinicCard from '@/components/ClinicCard'
import CreatorBadge from '@/components/CreatorBadge'
import { allClinics } from '@/data/all-clinics'
import { detectInfluencer, getInfluencerTier } from '@/lib/influencer'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Creator Clinics — GlowRoute',
  description: 'The providers building their brands on Instagram & TikTok. Elite medspa injectors and aesthetic nurses with active social followings.',
  alternates: { canonical: `${SITE_URL}/creators` },
}

const creatorClinics = allClinics
  .filter(detectInfluencer)
  .sort((a, b) => b.googleReviewCount - a.googleReviewCount)

function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function CreatorsPage() {
  const macro = creatorClinics.filter(c => getInfluencerTier(c) === 'Macro')
  const mid = creatorClinics.filter(c => getInfluencerTier(c) === 'Mid')
  const micro = creatorClinics.filter(c => getInfluencerTier(c) === 'Micro')

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-onyx text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Creator Clinics</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">
            ✨ Creator Clinics
          </h1>
          <p className="text-white/65 text-base leading-relaxed max-w-2xl mb-6">
            The providers building their brands on Instagram &amp; TikTok. These aesthetic nurses, injectors, and wellness practitioners have active social followings — and exceptional results to match.
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { label: 'Creator Clinics', value: creatorClinics.length.toString() },
              { label: 'Macro Tier', value: macro.length.toString() },
              { label: 'Mid Tier', value: mid.length.toString() },
              { label: 'Micro Tier', value: micro.length.toString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Tier explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { tier: 'Macro' as const, label: 'Macro', desc: '250K+ followers — regional tastemakers', count: macro.length },
            { tier: 'Mid' as const, label: 'Mid-Tier', desc: '50K–250K followers — city-level influence', count: mid.length },
            { tier: 'Micro' as const, label: 'Micro', desc: '10K–50K followers — highly engaged audiences', count: micro.length },
          ].map(({ tier, label, desc, count }) => (
            <div key={tier} className="bg-white border border-onyx/10 rounded-xl p-4">
              <CreatorBadge tier={tier} variant="card" />
              <p className="text-sm font-semibold text-onyx mt-2">{label} · {count} clinics</p>
              <p className="text-xs text-stone mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* All creator clinics */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-onyx">
            All Creator Clinics ({creatorClinics.length})
          </h2>
          <Link href="/clinics" className="text-sm font-semibold text-sage hover:underline">
            Full directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {creatorClinics.map(clinic => (
            <ClinicCard key={clinic.slug} clinic={clinic} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
