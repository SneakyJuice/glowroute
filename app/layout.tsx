import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SITE_URL } from '@/lib/config'

const dmSans = DM_Sans({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'GlowRoute — Discover Aesthetic Wellness',
  description: 'Discover the most curated aesthetic wellness providers near you — verified clinics, real results.',
  keywords: 'medspa, aesthetic clinic, botox, filler, semaglutide, peptide therapy, IV therapy, Tampa',
  openGraph: {
    title: 'GlowRoute — Discover Aesthetic Wellness',
    description: 'Discover the most curated aesthetic wellness providers near you — verified clinics, real results.',
    type: 'website',
    url: SITE_URL,
    siteName: 'GlowRoute',
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'GlowRoute — Discover Aesthetic Wellness' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GlowRoute — Discover Aesthetic Wellness',
    description: 'Discover the most curated aesthetic wellness providers near you — verified clinics, real results.',
    images: [`${SITE_URL}/og-default.jpg`],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} bg-ivory text-onyx`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}