import Link from 'next/link'
import { SITE_URL } from '@/lib/config'

export const metadata = {
  title: 'Find Your Ideal Aesthetic Treatment — GlowRoute Quiz',
  description: 'Take a 60‑second quiz to discover the best aesthetic treatments for your goals. Personalized recommendations based on your skin type, concerns, and budget.',
  openGraph: {
    title: 'Find Your Ideal Aesthetic Treatment — GlowRoute Quiz',
    description: 'Take a 60‑second quiz to discover the best aesthetic treatments for your goals. Personalized recommendations based on your skin type, concerns, and budget.',
    type: 'website',
    url: `${SITE_URL}/quiz`,
    images: [{ url: `${SITE_URL}/og-quiz.jpg`, width: 1200, height: 630, alt: 'GlowRoute Aesthetic Treatment Quiz' }],
  },
}

export default function QuizPage() {
  return (
    <main className="min-h-screen bg-ivory text-onyx">
      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-block text-xs tracking-[3px] uppercase text-pink mb-5">
          Personalized Aesthetic Matcher
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          Find the{' '}
          <span className="text-pink">Perfect Treatment</span>{' '}
          in 60 Seconds
        </h1>
        <p className="text-stone text-lg leading-relaxed mb-3">
          Answer a few quick questions about your skin, goals, and budget. We’ll match you with the most effective treatments and verified providers near you.
        </p>
        <p className="text-sm text-stone">✓ No sign‑up required · 100% personalized · Clinic‑grade results</p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 max-w-xl mx-auto text-center">
        <Link
          href="#"
          className="inline-block bg-pink text-white hover:bg-pink-dark px-8 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Start the Quiz →
        </Link>
        <p className="mt-4 text-sm text-stone">Average time: 60 seconds. No spam, ever.</p>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Why Use Our Quiz?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <h3 className="font-bold text-lg mb-3">Personalized</h3>
            <p className="text-sm text-stone">Algorithms analyze your skin type, concerns, and goals to recommend treatments that actually work for you.</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <h3 className="font-bold text-lg mb-3">Evidence‑Based</h3>
            <p className="text-sm text-stone">Recommendations are backed by clinical data and real patient outcomes, not marketing hype.</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <h3 className="font-bold text-lg mb-3">Provider Matched</h3>
            <p className="text-sm text-stone">Get matched with board‑certified providers in your area who specialize in your recommended treatments.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-24 text-center">
        <p className="text-stone text-sm mb-3">Ready to discover your ideal treatment?</p>
        <Link href="#" className="text-pink hover:underline text-sm">
          Start the GlowRoute Quiz →
        </Link>
      </section>
    </main>
  )
}