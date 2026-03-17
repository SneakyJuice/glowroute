import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Find Med Spas & Aesthetic Clinics Near You | GlowRoute',
  description: 'Browse 1,500+ verified med spas and aesthetic wellness clinics across Florida. Filter by treatment, location, and rating.',
  openGraph: {
    title: 'Find Med Spas & Aesthetic Clinics Near You | GlowRoute',
    description: 'Browse 1,500+ verified med spas and aesthetic wellness clinics across Florida. Filter by treatment, location, and rating.',
    type: 'website',
    url: `${SITE_URL}/clinics`,
    siteName: 'GlowRoute',
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'GlowRoute Clinic Directory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Med Spas & Aesthetic Clinics Near You | GlowRoute',
    description: 'Browse 1,500+ verified med spas and aesthetic wellness clinics across Florida.',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/clinics`,
  },
}

export default function ClinicsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
