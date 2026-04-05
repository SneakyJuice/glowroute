import { track } from '@vercel/analytics';

// Dynamic PostHog import — only runs client-side
const ph = () => {
  if (typeof window === 'undefined') return null
  try {
    return require('posthog-js').default
  } catch {
    return null
  }
}

const capture = (event: string, props?: Record<string, string>) => {
  // Vercel Analytics
  track(event, props)
  // PostHog
  ph()?.capture(event, props)
}

export const trackEvent = {
  leadFormView: (clinicName: string) =>
    capture('lead_form_view', { clinic: clinicName }),

  leadFormSubmit: (clinicName: string, treatment: string) =>
    capture('lead_form_submit', { clinic: clinicName, treatment }),

  claimStart: (clinicName: string) =>
    capture('claim_start', { clinic: clinicName }),

  specialtyClick: (slug: string) =>
    capture('specialty_click', { specialty: slug }),

  nearMeClick: () =>
    capture('near_me_click'),

  searchQuery: (query: string, city: string) =>
    capture('search', { query, city }),

  clinicProfileView: (clinicName: string, city: string) =>
    capture('clinic_profile_view', { clinic: clinicName, city }),

  phoneClick: (clinicName: string) =>
    capture('phone_click', { clinic: clinicName }),

  websiteClick: (clinicName: string) =>
    capture('website_click', { clinic: clinicName }),
}
