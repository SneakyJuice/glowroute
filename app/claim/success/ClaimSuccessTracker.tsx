'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export default function ClaimSuccessTracker() {
  const params = useSearchParams()

  useEffect(() => {
    const clinicSlug = params.get('clinic') || 'unknown'
    const tier = params.get('tier') || 'unknown'
    posthog.capture('claim_completed', {
      clinic_slug: clinicSlug,
      tier,
      revenue_event: true,
    })
  }, [params])

  return null
}
