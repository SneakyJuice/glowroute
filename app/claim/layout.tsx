import type { Metadata } from 'next'
import { NOINDEX_FOLLOW_ROBOTS } from '@/lib/indexing-pause'

export const metadata: Metadata = {
  robots: NOINDEX_FOLLOW_ROBOTS,
}

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return children
}
