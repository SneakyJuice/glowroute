import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Evolve Telemedicine Review  -  Telehealth Peptides | GlowRoute',
  description: 'Evolve Telemedicine specializes in peptide-forward protocols for performance optimization, recovery, and anti-aging  -  with a physician-supervised approach.',
  alternates: { canonical: `${SITE_URL}/telehealth/evolve-telemedicine` },
  openGraph: {
    title: 'Evolve Telemedicine  -  Peptide therapy and hormone optimization for high performers',
    description: 'Evolve Telemedicine specializes in peptide-forward protocols for performance optimization, recovery, and anti-aging  -  with a physician-supervised approach.',
    url: `${SITE_URL}/telehealth/evolve-telemedicine`,
    type: 'website',
    siteName: 'GlowRoute',
  },
}

export default function EvolveTelemedicinePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linen">

        {/* Hero */}
        <section className="bg-onyx text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <Link href="/telehealth" className="text-sage text-sm hover:underline">← All Telehealth Providers</Link>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-sage text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">Telehealth</span>
              <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">$150-$400/month</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-light mb-4">Evolve Telemedicine</h1>
            <p className="text-xl text-white/80 mb-6">Peptide therapy and hormone optimization for high performers</p>
            <div className="flex flex-wrap gap-2 mb-8">
            <span className="inline-block bg-sage/10 text-sage text-xs font-medium px-3 py-1 rounded-full">Peptides</span>
            <span className="inline-block bg-sage/10 text-sage text-xs font-medium px-3 py-1 rounded-full">TRT</span>
            <span className="inline-block bg-sage/10 text-sage text-xs font-medium px-3 py-1 rounded-full">Anti-Aging</span>
            <span className="inline-block bg-sage/10 text-sage text-xs font-medium px-3 py-1 rounded-full">Recovery</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://evolvetelemedicine.com"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-block bg-sage text-white font-semibold px-8 py-3 rounded hover:bg-sage/90 transition-colors text-center"
              >
                Get Started with Evolve Telemedicine →
              </a>
              <Link
                href="/quiz"
                className="inline-block bg-white/10 text-white font-semibold px-8 py-3 rounded hover:bg-white/20 transition-colors text-center"
              >
                Take the Treatment Quiz
              </Link>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">

            {/* Left  -  Main info */}
            <div className="md:col-span-2 space-y-8">

              {/* About */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-display font-light text-onyx mb-4">About Evolve Telemedicine</h2>
                <p className="text-stone-600 leading-relaxed">Evolve Telemedicine specializes in peptide-forward protocols for performance optimization, recovery, and anti-aging  -  with a physician-supervised approach.</p>
              </div>

              {/* Treatments */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-display font-light text-onyx mb-4">Treatments Offered</h2>
                <ul className="space-y-2 text-stone-700">
              <li className="flex items-start gap-2"><span className="text-sage mt-0.5">✓</span><span>BPC-157</span></li>
              <li className="flex items-start gap-2"><span className="text-sage mt-0.5">✓</span><span>TB-500</span></li>
              <li className="flex items-start gap-2"><span className="text-sage mt-0.5">✓</span><span>Ipamorelin/CJC-1295</span></li>
              <li className="flex items-start gap-2"><span className="text-sage mt-0.5">✓</span><span>Epitalon</span></li>
              <li className="flex items-start gap-2"><span className="text-sage mt-0.5">✓</span><span>MOTS-c</span></li>
              <li className="flex items-start gap-2"><span className="text-sage mt-0.5">✓</span><span>TRT</span></li>
              <li className="flex items-start gap-2"><span className="text-sage mt-0.5">✓</span><span>GHK-Cu</span></li>
                </ul>
              </div>

              {/* Strengths */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-display font-light text-onyx mb-4">Why Evolve Telemedicine?</h2>
                <ul className="space-y-2 text-stone-700">
              <li className="flex items-start gap-2"><span className="text-sage font-bold mt-0.5">→</span><span>Peptide expertise</span></li>
              <li className="flex items-start gap-2"><span className="text-sage font-bold mt-0.5">→</span><span>Performance focus</span></li>
              <li className="flex items-start gap-2"><span className="text-sage font-bold mt-0.5">→</span><span>Recovery protocols</span></li>
              <li className="flex items-start gap-2"><span className="text-sage font-bold mt-0.5">→</span><span>Biohacker-friendly</span></li>
                </ul>
              </div>

              {/* Best For */}
              <div className="bg-sage/5 border border-sage/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-onyx mb-2">Best For</h2>
                <p className="text-stone-700">Athletes and high performers who want peptide-first protocols from a provider who understands performance</p>
              </div>
            </div>

            {/* Right  -  Sidebar */}
            <div className="space-y-4">

              {/* Quick Facts */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-onyx mb-3">Quick Facts</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Price Range</dt>
                    <dd className="font-medium text-onyx">$150-$400/month</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Telehealth</dt>
                    <dd className="font-medium text-sage">✓ Online</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Prescription</dt>
                    <dd className="font-medium text-sage">✓ Included</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Target Patient</dt>
                    <dd className="font-medium text-onyx text-right text-xs leading-tight">Athletes, executives, and biohackers foc</dd>
                  </div>
                </dl>
              </div>

              {/* CTA */}
              <div className="bg-onyx text-white rounded-xl p-5">
                <h3 className="font-semibold mb-2">Ready to start?</h3>
                <p className="text-white/70 text-sm mb-4">Complete an online intake  -  most patients get a response within 24-48 hours.</p>
                <a
                  href="https://evolvetelemedicine.com"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="block w-full bg-sage text-white text-center font-semibold py-2.5 rounded hover:bg-sage/90 transition-colors text-sm"
                >
                  Visit Evolve Telemedicine →
                </a>
              </div>

              {/* Not sure CTA */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-onyx mb-2">Not sure which provider?</h3>
                <p className="text-stone-600 text-sm mb-3">Take our 2-minute quiz to find the right match for your goals.</p>
                <Link
                  href="/quiz"
                  className="block w-full bg-linen text-onyx text-center font-semibold py-2.5 rounded hover:bg-sage/10 transition-colors text-sm border border-stone-200"
                >
                  Take the Quiz →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Compare CTA */}
        <section className="bg-white border-t border-stone-100 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-display font-light text-onyx mb-3">Compare All Telehealth Providers</h2>
            <p className="text-stone-600 mb-6">GlowRoute has reviewed 10+ telehealth platforms so you can find the right fit for your goals and budget.</p>
            <Link
              href="/telehealth"
              className="inline-block bg-onyx text-white font-semibold px-8 py-3 rounded hover:bg-stone-800 transition-colors"
            >
              View All Providers →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
