import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/config'
import { fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'
import { DirectoryQueryError, parseDirectoryQuery, searchDirectory, serializeDirectoryQuery } from '@/lib/directory-search'
import ClinicsClient from '@/app/clinics/ClinicsClient'

export const dynamic = 'force-dynamic'
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  return {
    title: 'GlowRoute — Find Med Spas & Aesthetic Clinics Near You',
    description: 'Discover and compare med spas and aesthetic clinics nationwide. Search by treatment and city, and explore provider information.',
    alternates: { canonical: SITE_URL },
    ...(Object.keys(params).length ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  try {
    const query = parseDirectoryQuery(params)
    const pool = await fetchAllClinicsFromSupabase()
    const initialPage = searchDirectory(pool, query)
    const organization = { '@context': 'https://schema.org', '@type': 'Organization', '@id': SITE_URL + '/#organization', name: 'GlowRoute', url: SITE_URL, logo: SITE_URL + '/logo.png' }
    const website = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL, name: 'GlowRoute', publisher: { '@id': SITE_URL + '/#organization' } }
    return <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <ClinicsClient key={serializeDirectoryQuery(initialPage.query).toString()} initialPage={initialPage} totalCount={pool.length} />
    </>
  } catch (error) {
    if (!(error instanceof DirectoryQueryError)) throw error
    return <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl">Check your search filters</h1>
      <p role="alert" className="mt-4">{error.message}</p>
      <Link href="/clinics" className="inline-block mt-6 text-sage underline">Start a new search</Link>
    </main>
  }
}
