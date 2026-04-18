import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Best Telehealth Providers for Hormone Therapy & Peptides (2026) | GlowRoute',
  description: 'Compare the top telehealth platforms for TRT, GLP-1 weight loss, peptide therapy, and hormone optimization. Find the right online provider for your goals.',
  alternates: { canonical: `${SITE_URL}/telehealth` },
  openGraph: {
    title: 'Best Telehealth Providers for Hormones & Peptides (2026)',
    description: 'Compare TRT, GLP-1, peptide therapy, and HRT telehealth platforms. GlowRoute reviews the top 10 online providers.',
    url: `${SITE_URL}/telehealth`,
    type: 'website',
    siteName: 'GlowRoute',
  },
}

export default function TelehealthIndexPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linen">

        {/* Hero */}
        <section className="bg-onyx text-white py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <span className="inline-block bg-sage text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wide mb-6">Telehealth Directory</span>
            <h1 className="text-4xl md:text-5xl font-display font-light mb-4">
              Find the Right Telehealth Provider
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Compare the top online clinics for testosterone therapy, GLP-1 weight loss, peptides, and hormone optimization — all physician-supervised, all from home.
            </p>
            <Link
              href="/quiz"
              className="inline-block bg-sage text-white font-semibold px-8 py-3 rounded hover:bg-sage/90 transition-colors"
            >
              Take the Quiz — Find Your Match →
            </Link>
          </div>
        </section>

        {/* Filter bar */}
        <section className="bg-white border-b border-stone-100 py-4 px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap gap-2 justify-center">
            {['All', 'TRT', 'GLP-1 / Weight Loss', 'Peptides', 'Women\'s HRT', 'Longevity'].map(tag => (
              <span key={tag} className="bg-stone-100 text-stone-700 text-sm px-4 py-1.5 rounded-full cursor-pointer hover:bg-sage/10 hover:text-sage transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-light text-onyx">10 Providers Reviewed</h2>
            <p className="text-stone-500 text-sm">Updated April 2026</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">

          <Link key="hone-health" href="/telehealth/hone-health" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Hone Health</h2>
                <p className="text-stone-500 text-sm mt-1">$75–$200/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">Testosterone Replacement Therapy</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Hormone optimization for men — TRT, peptides, and metabolic health</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Testosterone Replacement Therapy</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Peptide Therapy</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Growth Hormone</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="henry-meds" href="/telehealth/henry-meds" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Henry Meds</h2>
                <p className="text-stone-500 text-sm mt-1">$35–$199/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">GLP-1 Weight Loss</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">GLP-1, TRT, and metabolic health — affordable telehealth at scale</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">GLP-1 Weight Loss</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Testosterone</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Thyroid</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="maximus-trt" href="/telehealth/maximus-trt" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Maximus</h2>
                <p className="text-stone-500 text-sm mt-1">$129–$299/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">Testosterone</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Male optimization: TRT, peptides, and peak performance protocols</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Testosterone</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Peptides</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Fertility Preservation</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="winona" href="/telehealth/winona" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Winona</h2>
                <p className="text-stone-500 text-sm mt-1">$99–$249/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">Menopause HRT</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Menopause hormone therapy — physician-prescribed, delivered to your door</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Menopause HRT</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Bioidentical Hormones</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Sexual Health</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="ro-health" href="/telehealth/ro-health" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Ro</h2>
                <p className="text-stone-500 text-sm mt-1">$69–$299/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">GLP-1 Weight Loss</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Weight loss, ED, hair, and primary care — one telehealth platform</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">GLP-1 Weight Loss</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">ED Treatment</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Hair Loss</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="hims" href="/telehealth/hims" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Hims</h2>
                <p className="text-stone-500 text-sm mt-1">$25–$199/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">ED</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Men's health made simple — ED, hair loss, weight, and mental health</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">ED</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Hair Loss</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Weight Loss</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="fountain-trt" href="/telehealth/fountain-trt" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Fountain TRT</h2>
                <p className="text-stone-500 text-sm mt-1">$149–$249/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">Testosterone Replacement</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Testosterone therapy built for men who want results fast</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Testosterone Replacement</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Enclomiphene</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Anastrozole</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="defy-medical" href="/telehealth/defy-medical" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Defy Medical</h2>
                <p className="text-stone-500 text-sm mt-1">$200–$500/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">TRT</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Comprehensive hormone optimization and peptide therapy — nationwide</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">TRT</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Peptides</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Female Hormones</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="evolve-telemedicine" href="/telehealth/evolve-telemedicine" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Evolve Telemedicine</h2>
                <p className="text-stone-500 text-sm mt-1">$150–$400/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">Peptides</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Peptide therapy and hormone optimization for high performers</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Peptides</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">TRT</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Anti-Aging</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          <Link key="nuvation-health" href="/telehealth/nuvation-health" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-light text-onyx group-hover:text-sage transition-colors">Nuvation Health</h2>
                <p className="text-stone-500 text-sm mt-1">$199–$499/month</p>
              </div>
              <span className="bg-sage/10 text-sage text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">Longevity</span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">Personalized longevity and metabolic health — precision telehealth</p>
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Longevity</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Metabolic Health</span>
              <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">Hormone Optimization</span>
            </div>
            <span className="text-sage text-sm font-semibold group-hover:underline">Learn more →</span>
          </Link>
          </div>
        </section>

        {/* Quiz CTA */}
        <section className="bg-onyx text-white py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-light mb-3">Not sure where to start?</h2>
            <p className="text-white/70 mb-6">Answer 5 questions and we\'ll match you with the telehealth provider that fits your goals, budget, and health history.</p>
            <Link
              href="/quiz"
              className="inline-block bg-sage text-white font-semibold px-8 py-3 rounded hover:bg-sage/90 transition-colors"
            >
              Take the Free Quiz →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
