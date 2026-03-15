import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GlowRoute — Find Your Medspa & Aesthetic Clinic',
  description: 'The most comprehensive directory of medspas and aesthetic clinics. Find verified clinics near you with real reviews, treatment filters, and transparent pricing.',
  keywords: 'medspa, aesthetic clinic, botox, filler, semaglutide, peptide therapy, IV therapy, Tampa',
  openGraph: {
    title: 'GlowRoute — Find Your Medspa & Aesthetic Clinic',
    description: 'Find verified medspas and aesthetic clinics near you.',
    type: 'website',
    url: 'https://glowroute.sealey.ai',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-cream text-navy`}>{children}</body>
    </html>
  )
}
