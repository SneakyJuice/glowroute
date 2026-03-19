import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TREATMENTS } from '@/lib/treatments'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Medspa Treatments Near You — GlowRoute',
  description: 'Browse all aesthetic treatments available at medspas across the Southeast — Botox, laser hair removal, weight loss, peptide therapy, and more.',
  alternates: { canonical: `${SITE_URL}/treatments` },
}

const TREATMENT_ICONS: Record<string, string> = {
  'botox-fillers':         '💉',
  'laser-hair-removal':    '⚡',
  'hydrafacial':           '✨',
  'weight-loss-ozempic':   '⚖️',
  'iv-therapy':            '🩸',
  'microneedling':         '🔬',
  'chemical-peels':        '🧴',
  'trt-testosterone':      '💪',
  'peptide-therapy':       '🧬',
  'coolsculpting':         '❄️',
}

export default function TreatmentsPage() {
  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <section className="bg-onyx text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Treatments</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">
            Aesthetic Treatments Near You
          </h1>
          <p className="text-white/65 text-base leading-relaxed max-w-2xl">
            Browse medspas across the Southeast by treatment type. Find the right clinic for your goals.
          </p>
        </div>
      </section>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TREATMENTS.map(t => (
            <Link
              key={t.slug}
              href={`/treatments/${t.slug}`}
              className="bg-white border border-onyx/10 rounded-2xl p-5 hover:border-sage/40 hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-3">{TREATMENT_ICONS[t.slug] ?? '🏥'}</div>
              <h2 className="font-serif text-lg font-semibold text-onyx mb-1 group-hover:text-sage transition-colors">
                {t.name}
              </h2>
              <p className="text-sm text-stone leading-relaxed line-clamp-2">{t.description}</p>
              <p className="text-xs font-semibold text-sage mt-3">Find clinics →</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/clinics"
            className="inline-block border border-onyx/15 text-onyx text-sm font-semibold px-6 py-2.5 rounded-xl hover:border-sage hover:text-sage transition-colors"
          >
            Browse Full Directory →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
