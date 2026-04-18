import Link from 'next/link'
import { SITE_URL } from '@/lib/config'

export const metadata = {
  title: 'Telehealth Aesthetic Consultations — GlowRoute',
  description: 'Book virtual consultations with top-rated aesthetic providers. Secure video visits, e-prescriptions, and online pharmacy fulfillment.',
  openGraph: {
    title: 'Telehealth Aesthetic Consultations — GlowRoute',
    description: 'Book virtual consultations with top-rated aesthetic providers. Secure video visits, e-prescriptions, and online pharmacy fulfillment.',
    type: 'website',
    url: `${SITE_URL}/telehealth`,
    images: [{ url: `${SITE_URL}/og-telehealth.jpg`, width: 1200, height: 630, alt: 'Telehealth Aesthetic Consultations' }],
  },
}

export default function TelehealthPage() {
  return (
    <main className="min-h-screen bg-ivory text-onyx">
      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-block text-xs tracking-[3px] uppercase text-sage mb-5">
          Virtual Aesthetic Consultations
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          Expert Aesthetic Care{' '}
          <span className="text-sage">From Anywhere</span>
        </h1>
        <p className="text-stone text-lg leading-relaxed mb-3">
          Connect with board-certified providers via secure video visits. Get personalized treatment plans, e‑prescriptions, and ongoing support — all from the comfort of your home.
        </p>
        <p className="text-sm text-stone">✓ HIPAA compliant · No‑wait appointments · Licensed in 50 states</p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 max-w-xl mx-auto text-center">
        <Link
          href="/claim"
          className="inline-block bg-sage text-white hover:bg-sage-dark px-8 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Book a Virtual Consultation →
        </Link>
        <p className="mt-4 text-sm text-stone">First visit free for new patients.</p>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Why Choose Telehealth?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <h3 className="font-bold text-lg mb-3">Convenience</h3>
            <p className="text-sm text-stone">No travel, no waiting rooms. Schedule appointments that fit your schedule, including evenings and weekends.</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <h3 className="font-bold text-lg mb-3">Privacy</h3>
            <p className="text-sm text-stone">Secure, encrypted video platform. Your medical information stays confidential and protected.</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <h3 className="font-bold text-lg mb-3">Continuity</h3>
            <p className="text-sm text-stone">Follow‑up visits, prescription refills, and progress tracking — all through your patient portal.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-24 text-center">
        <p className="text-stone text-sm mb-3">Ready to get started?</p>
        <Link href="/claim" className="text-sage hover:underline text-sm">
          Claim your clinic to enable telehealth →
        </Link>
      </section>
    </main>
  )
}