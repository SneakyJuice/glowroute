import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/config'
import { fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'
import { DirectoryQueryError, parseDirectoryQuery, searchDirectory, serializeDirectoryQuery } from '@/lib/directory-search'
import ClinicsClient from './ClinicsClient'

export const dynamic = 'force-dynamic'
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  return {
    title: 'Find Med Spas & Aesthetic Clinics | GlowRoute',
    description: 'Search med spas and aesthetic clinics by treatment and city. Explore provider profiles and compare your options.',
    alternates: { canonical: SITE_URL + '/clinics' },
    ...(Object.keys(params).length ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function ClinicsPage({ searchParams }: PageProps) {
  const params = await searchParams
  try {
    const query = parseDirectoryQuery(params)
    const pool = await fetchAllClinicsFromSupabase()
    const initialPage = searchDirectory(pool, query)
    return <ClinicsClient key={serializeDirectoryQuery(initialPage.query).toString()} initialPage={initialPage} totalCount={pool.length} />
  } catch (error) {
    if (!(error instanceof DirectoryQueryError)) throw error
    return <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl">Check your search filters</h1>
      <p role="alert" className="mt-4">{error.message}</p>
      <Link href="/clinics" className="inline-block mt-6 text-sage underline">Start a new search</Link>
    </main>
  }
}
