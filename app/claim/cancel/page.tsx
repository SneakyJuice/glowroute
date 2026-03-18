import Link from 'next/link'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function CancelContent() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {/* Cancel icon */}
      <div className="w-16 h-16 bg-stone/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-stone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>

      <h1 className="font-serif text-3xl font-semibold text-onyx mb-3">
        Checkout cancelled
      </h1>
      <p className="text-stone leading-relaxed mb-8">
        No worries — nothing was charged. You can return and claim your listing whenever you&apos;re ready.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/claim"
          className="inline-block bg-sage text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-sage/80 transition-colors"
        >
          Try Again
        </Link>
        <Link
          href="/clinics"
          className="inline-block border border-onyx/15 text-onyx text-sm font-semibold px-6 py-3 rounded-xl hover:border-sage/40 hover:text-sage transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    </div>
  )
}

export default function ClaimCancelPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center text-stone text-sm">Loading…</div>}>
        <CancelContent />
      </Suspense>
      <Footer />
    </div>
  )
}
