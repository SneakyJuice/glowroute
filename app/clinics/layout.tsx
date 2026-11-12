import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Find Med Spas & Aesthetic Clinics Near You | GlowRoute',
  description: 'Compare med spas and aesthetic clinics by treatment and location. Check listing details, contact providers, and see which listings are verified.',
  openGraph: {
    title: 'Find Med Spas & Aesthetic Clinics Near You | GlowRoute',
    description: 'Compare med spas and aesthetic clinics by treatment and location. Check listing details and contact providers.',
    type: 'website',
    url: `${SITE_URL}/clinics`,
    siteName: 'GlowRoute',
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'GlowRoute Clinic Directory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Med Spas & Aesthetic Clinics Near You | GlowRoute',
    description: 'Compare med spas and aesthetic clinics by treatment and location.',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/clinics`,
  },
}

export default function ClinicsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
