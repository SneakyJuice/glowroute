import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GlowRoute — Discover Aesthetic Wellness',
  description: 'Discover the most curated aesthetic wellness providers near you — verified clinics, real results.',
  keywords: 'medspa, aesthetic clinic, botox, filler, semaglutide, peptide therapy, IV therapy, Tampa',
  openGraph: {
    title: 'GlowRoute — Discover Aesthetic Wellness',
    description: 'Discover the most curated aesthetic wellness providers near you — verified clinics, real results.',
    type: 'website',
    url: 'https://glowroute.io',
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
