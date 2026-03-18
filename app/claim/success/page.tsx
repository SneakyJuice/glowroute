import Link from 'next/link'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function SuccessContent() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1 className="font-serif text-3xl font-semibold text-onyx mb-3">
        You&apos;re all set!
      </h1>
      <p className="text-stone leading-relaxed mb-2">
        Your listing claim is confirmed and your subscription is active. We&apos;re verifying your
        ownership and will send setup instructions to your email within 1 business day.
      </p>
      <p className="text-stone text-sm leading-relaxed mb-8">
        Questions?{' '}
        <a href="mailto:hello@glowroute.io" className="text-sage hover:underline">
          hello@glowroute.io
        </a>
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/clinics" className="inline-block bg-sage text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-sage/80 transition-colors">
          Browse Directory
        </Link>
        <Link href="/" className="inline-block border border-onyx/15 text-onyx text-sm font-semibold px-6 py-3 rounded-xl hover:border-sage/40 hover:text-sage transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function ClaimSuccessPage() {
  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center text-stone text-sm">Loading…</div>}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </div>
  )
}
