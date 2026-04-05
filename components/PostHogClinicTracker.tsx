'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

interface Props {
  clinicSlug: string
  clinicName: string
  city: string
  services: string[]
  status: string
}

export function PostHogClinicTracker({ clinicSlug, clinicName, city, services, status }: Props) {
  useEffect(() => {
    posthog.capture('clinic_profile_view', {
      clinic_slug: clinicSlug,
      clinic_name: clinicName,
      city,
      services,
      status,
    })
  }, [clinicSlug, clinicName, city, services, status])

  return null
}

export function trackContactClick(type: 'phone' | 'email' | 'website', clinicSlug: string, clinicName: string) {
  posthog.capture('clinic_contact_click', { type, clinic_slug: clinicSlug, clinic_name: clinicName })
}

export function trackLeadSubmit(clinicSlug: string, clinicName: string) {
  posthog.capture('lead_form_submit', { clinic_slug: clinicSlug, clinic_name: clinicName })
}

export function trackClaimStarted(clinicSlug: string) {
  posthog.capture('claim_started', { clinic_slug: clinicSlug })
}

export function trackClaimSubmitted(clinicSlug: string, tier: string) {
  posthog.capture('claim_submitted', { clinic_slug: clinicSlug, tier })
}
