'use client'

import { useState } from 'react'
import type { PlanKey } from '@/lib/stripe'
import { trackClaimStarted, trackClaimSubmitted } from '@/components/PostHogClinicTracker'

interface Props {
  tier: PlanKey
  clinicSlug: string
  clinicName: string
  highlight?: boolean
}

export default function ClaimCheckoutButton({ tier, clinicSlug, clinicName, highlight }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    trackClaimStarted(clinicSlug)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, clinicSlug, clinicName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(data.error ?? 'Request failed')
      }
      const { url } = await res.json()
      if (!url) throw new Error('No checkout URL returned')
      trackClaimSubmitted(clinicSlug, tier)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          highlight
            ? 'bg-sage text-white hover:bg-sage/85'
            : 'bg-onyx text-white hover:bg-onyx/85'
        }`}
      >
        {loading ? 'Redirecting…' : 'Claim This Listing →'}
      </button>
      {error && <p className="text-[11px] text-red-600 mt-2 text-center">{error}</p>}
    </div>
  )
}
