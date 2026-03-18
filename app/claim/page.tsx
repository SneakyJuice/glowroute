'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type FormState = 'idle' | 'loading' | 'error'
type PlanKey = 'basic' | 'pro'

const PLANS: Record<PlanKey, { name: string; price: string; priceNote: string; features: string[]; highlight?: boolean }> = {
  basic: {
    name: 'Basic',
    price: '$99',
    priceNote: '/month',
    features: [
      'Claim & verify your listing',
      'Update photos & contact info',
      'Respond to leads',
      'Remove competitor ads',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$249',
    priceNote: '/month',
    highlight: true,
    features: [
      'Everything in Basic',
      'Featured placement in search',
      'Priority ranking',
      'Analytics dashboard',
      'GlowRoute Verified badge',
    ],
  },
}

function ClaimForm() {
  const searchParams = useSearchParams()
  const prefilledClinic = searchParams.get('clinic') || ''
  const prefilledSlug = searchParams.get('slug') || ''

  const [state, setState] = useState<FormState>('idle')
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('basic')
  const [clinicName, setClinicName] = useState(prefilledClinic)
  const [yourName, setYourName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')

    try {
      // 1. Submit lead notification (fire-and-forget — don't block checkout)
      fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicName, yourName, email, phone, role }),
      }).catch(() => {/* non-critical */})

      // 2. Create Stripe Checkout session
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          clinicSlug: prefilledSlug || clinicName.toLowerCase().replace(/\s+/g, '-'),
          clinicName,
          email,
          ownerName: yourName,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const { url } = await res.json()
      if (!url) throw new Error('No checkout URL returned')

      // 3. Redirect to Stripe Checkout
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedPlan(key)}
            className={`text-left rounded-2xl border p-5 transition-all ${
              selectedPlan === key
                ? 'border-sage bg-sage/5 shadow-sm ring-1 ring-sage/30'
                : 'border-onyx/10 bg-ivory hover:border-sage/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`font-serif text-lg font-semibold ${plan.highlight ? 'text-sage' : 'text-onyx'}`}>
                  {plan.name}
                </span>
                {plan.highlight && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-sage text-white px-2 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                selectedPlan === key ? 'border-sage bg-sage' : 'border-onyx/25'
              }`}>
                {selectedPlan === key && (
                  <svg className="w-full h-full text-white" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="3"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="mb-3">
              <span className="text-2xl font-bold text-onyx">{plan.price}</span>
              <span className="text-stone text-sm">{plan.priceNote}</span>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-stone">
                  <svg className="w-3.5 h-3.5 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Claim form */}
      {(state === 'idle' || state === 'loading' || state === 'error') && (
        <>
          {state === 'error' && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {errorMsg || 'Something went wrong. Please try again.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-ivory border border-onyx/10 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
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
                <label className="block text-xs font-semibold text-onyx/70 mb-1.5 uppercase tracking-wide" htmlFor="claim-role">
                  Your Role
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
                  Phone
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
            </div>

            <button
              type="submit"
              disabled={state === 'loading'}
              className="w-full bg-sage text-white text-sm font-semibold py-3 rounded-xl hover:bg-sage/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {state === 'loading'
                ? 'Redirecting to checkout…'
                : `Continue to Payment — ${PLANS[selectedPlan].price}/mo →`}
            </button>

            <p className="text-[11px] text-stone text-center leading-relaxed pt-1">
              Secure checkout powered by Stripe. Cancel anytime. 30-day money-back guarantee.
            </p>
          </form>
        </>
      )}
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
