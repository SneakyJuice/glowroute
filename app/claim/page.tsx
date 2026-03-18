'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { PLANS } from '@/lib/stripe'
import type { PlanKey } from '@/lib/stripe'

type FormState = 'idle' | 'loading' | 'error'

const PLAN_ORDER: PlanKey[] = ['starter', 'growth', 'pro']

function ClaimForm() {
  const searchParams = useSearchParams()
  const prefilledClinic = searchParams.get('clinic') || ''
  const prefilledSlug   = searchParams.get('slug') || ''

  const [state, setState] = useState<FormState>('idle')
  const [tier, setTier] = useState<PlanKey>('starter')
  const [clinicName, setClinicName] = useState(prefilledClinic)
  const [yourName, setYourName]     = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [role, setRole]             = useState('')
  const [errorMsg, setErrorMsg]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')
    try {
      // Fire lead notification (non-blocking)
      fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicName, yourName, email, phone, role }),
      }).catch(() => {})

      // Create Stripe Checkout
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          clinicSlug: prefilledSlug || clinicName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          clinicName,
          email,
          ownerName: yourName,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const { url } = await res.json()
      if (!url) throw new Error('No checkout URL returned')
      window.location.href = url
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/clinics" className="text-sm text-stone hover:text-onyx flex items-center gap-1 mb-6">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Back to Directory
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-onyx mb-2">Claim Your Listing</h1>
        <p className="text-stone text-sm leading-relaxed">
          Take control of your profile. Manage info, respond to leads, and get discovered by more patients.
        </p>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {PLAN_ORDER.map(key => {
          const plan = PLANS[key]
          const isHighlight = 'highlight' in plan && plan.highlight
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTier(key)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                tier === key
                  ? 'border-sage bg-sage/5 ring-1 ring-sage/30 shadow-sm'
                  : 'border-onyx/10 bg-ivory hover:border-sage/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-onyx">{plan.name}</span>
                  {isHighlight && (
                    <span className="text-[9px] font-bold uppercase tracking-wide bg-sage text-white px-1.5 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border-2 transition-colors flex-shrink-0 ${tier === key ? 'border-sage bg-sage' : 'border-onyx/25'}`} />
              </div>
              <p className="text-xl font-bold text-onyx">{plan.monthlyLabel}</p>
              <p className="text-[11px] text-stone mt-0.5">{plan.tagline}</p>
            </button>
          )
        })}
      </div>

      {state === 'error' && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {errorMsg || 'Something went wrong. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-onyx/10 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-onyx/60 mb-1.5 uppercase tracking-wide">
              Clinic Name <span className="text-red-400">*</span>
            </label>
            <input type="text" required value={clinicName} onChange={e => setClinicName(e.target.value)}
              placeholder="Luxe Aesthetics Tampa"
              className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-onyx/60 mb-1.5 uppercase tracking-wide">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input type="text" required value={yourName} onChange={e => setYourName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-onyx/60 mb-1.5 uppercase tracking-wide">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition">
              <option value="">Select role…</option>
              <option value="Owner">Owner</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-onyx/60 mb-1.5 uppercase tracking-wide">
              Business Email <span className="text-red-400">*</span>
            </label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jane@yourclinic.com"
              className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-onyx/60 mb-1.5 uppercase tracking-wide">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+1 (813) 000-0000"
              className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2.5 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition" />
          </div>
        </div>
        <button type="submit" disabled={state === 'loading'}
          className="w-full bg-sage text-white text-sm font-semibold py-3 rounded-xl hover:bg-sage/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
          {state === 'loading' ? 'Redirecting to checkout…' : `Continue — ${PLANS[tier].monthlyLabel} →`}
        </button>
        <p className="text-[11px] text-stone text-center leading-relaxed pt-1">
          Secure checkout via Stripe. Cancel anytime. 30-day money-back guarantee.
        </p>
      </form>
    </div>
  )
}

export default function ClaimPage() {
  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center text-stone text-sm">Loading…</div>}>
        <ClaimForm />
      </Suspense>
      <Footer />
    </div>
  )
}
