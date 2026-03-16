import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ClaimVerifyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-sage"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl font-semibold text-onyx mb-3">
          Listing Verified
        </h1>

        <p className="text-stone leading-relaxed mb-8">
          Your listing has been successfully verified on GlowRoute.
          You now have access to update your clinic info, respond to leads,
          and view analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/clinics"
            className="inline-block bg-sage text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-sage/80 transition-colors"
          >
            View Directory
          </Link>
          <Link
            href="/"
            className="inline-block border border-onyx/15 text-onyx text-sm font-semibold px-6 py-3 rounded-xl hover:border-sage/40 hover:text-sage transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
