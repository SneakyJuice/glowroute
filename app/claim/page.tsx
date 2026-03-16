'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type FormState = 'idle' | 'loading' | 'success' | 'error'

function ClaimForm() {
  const searchParams = useSearchParams()
  const prefilledClinic = searchParams.get('clinic') || ''

  const [state, setState] = useState<FormState>('idle')
  const [clinicName, setClinicName] = useState(prefilledClinic)
  const [yourName, setYourName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicName, yourName, email, phone, role }),
      })

      if (!res.ok) throw new Error('Request failed')

      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="font-serif text-3xl font-semibold text-onyx mb-3">Check your email.</h2>
        <p className="text-stone max-w-sm mx-auto leading-relaxed">
          We received your claim for <strong className="text-onyx">{clinicName}</strong>. Our team will verify your ownership and reach out within 1–2 business days.
        </p>
        <Link
          href="/clinics"
          className="inline-block mt-8 text-sm font-semibold text-sage hover:underline"
        >
          ← Back to Directory
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/clinics" className="text-sm text-stone hover:text-onyx flex items-center gap-1 mb-6">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Back to Directory
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-onyx mb-2">Claim Your Listing</h1>
        <p className="text-stone text-sm leading-relaxed">
          Verify your ownership to update clinic info, respond to leads, and unlock analytics.
        </p>
      </div>

      {state === 'error' && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Something went wrong. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-ivory border border-onyx/10 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-onyx/70 mb-1.5 uppercase tracking-wide" htmlFor="claim-clinic">
            Clinic Name <span className="text-red-400">*</span>
          </label>
          <input
            id="claim-clinic"
            type="text"
            required
            value={clinicName}
            onChange={e => setClinicName(e.target.value)}
            placeholder="Luxe Aesthetics Tampa"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-onyx/70 mb-1.5 uppercase tracking-wide" htmlFor="claim-name">
            Your Name <span className="text-red-400">*</span>
          </label>
          <input
            id="claim-name"
            type="text"
            required
            value={yourName}
            onChange={e => setYourName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-onyx/70 mb-1.5 uppercase tracking-wide" htmlFor="claim-email">
            Business Email <span className="text-red-400">*</span>
          </label>
          <input
            id="claim-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jane@yourclinic.com"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-onyx/70 mb-1.5 uppercase tracking-wide" htmlFor="claim-phone">
            Phone <span className="text-stone/40 font-normal normal-case">(optional)</span>
          </label>
          <input
            id="claim-phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 (813) 000-0000"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-onyx/70 mb-1.5 uppercase tracking-wide" htmlFor="claim-role">
            Your Role <span className="text-stone/40 font-normal normal-case">(optional)</span>
          </label>
          <select
            id="claim-role"
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          >
            <option value="">Select role…</option>
            <option value="Owner">Owner</option>
            <option value="Manager">Manager</option>
            <option value="Staff">Staff</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full bg-sage text-white text-sm font-semibold py-3 rounded-xl hover:bg-sage/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {state === 'loading' ? 'Submitting…' : 'Submit Claim →'}
        </button>

        <p className="text-[11px] text-stone text-center leading-relaxed pt-1">
          We verify all claims before granting access. No credit card required.
        </p>
      </form>
    </div>
  )
}

export default function ClaimPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center text-stone text-sm">Loading…</div>}>
        <ClaimForm />
      </Suspense>
      <Footer />
    </div>
  )
}
