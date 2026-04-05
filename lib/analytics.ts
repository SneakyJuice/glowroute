import { track } from '@vercel/analytics';

export const trackEvent = {
  leadFormView: (clinicName: string) => track('lead_form_view', { clinic: clinicName }),
  leadFormSubmit: (clinicName: string, treatment: string) => track('lead_form_submit', { clinic: clinicName, treatment }),
  claimStart: (clinicName: string) => track('claim_start', { clinic: clinicName }),
  specialtyClick: (slug: string) => track('specialty_click', { specialty: slug }),
  nearMeClick: () => track('near_me_click'),
  searchQuery: (query: string, city: string) => track('search', { query, city }),
};
