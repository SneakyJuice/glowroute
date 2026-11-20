import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'

const url = `${SITE_URL}/bloodwork`

export const metadata: Metadata = {
  title: 'Know Your Numbers First — GlowRoute',
  description: 'Every effective treatment starts with a baseline. Compare blood tests before starting GLP-1, peptide, or hormone care.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Know Your Numbers First — GlowRoute',
    description: 'Compare blood tests before starting GLP-1, peptide, or hormone care.',
    url,
    type: 'website',
    siteName: 'GlowRoute',
  },
}

export default function BloodworkLayout({ children }: { children: React.ReactNode }) {
  return children
}
