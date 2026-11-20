import type { Metadata } from 'next'
import Link from 'next/link'
import { NOINDEX_FOLLOW_ROBOTS } from '@/lib/indexing-pause'

export const metadata: Metadata = {
  title: 'Page not found — GlowRoute',
  description: 'This URL is not a GlowRoute page.',
  robots: NOINDEX_FOLLOW_ROBOTS,
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ivory px-6 py-24 text-onyx">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-serif text-4xl">Page not found</h1>
        <p className="mt-4 text-stone">That URL is not a GlowRoute page.</p>
        <Link href="/" className="mt-8 inline-block text-sage underline">Back to GlowRoute</Link>
      </div>
    </main>
  )
}
