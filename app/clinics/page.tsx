import type { Metadata } from 'next'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { SITE_URL } from '@/lib/config'
import { fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'
import { cityQueryRedirectPath, knownCitySlugsFromNames } from '@/lib/city-query-redirect'
import { DirectoryQueryError, parseDirectoryPageQuery, searchDirectory, serializeDirectoryQuery } from '@/lib/directory-search'
import { aggregateLiveCityHubs, citySlugToDisplay } from '@/lib/seo-page-overrides'
import { skipUnreachableDatabasePrerender } from '@/lib/skip-build-prerender'
import ClinicsClient from './ClinicsClient'

export const revalidate = 900
export const maxDuration = 30
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
    const query = parseDirectoryPageQuery(params)
    const pool = await fetchAllClinicsFromSupabase()
    const destination = cityQueryRedirectPath(params, knownCitySlugsFromNames(
      pool.filter(clinic => clinic.city && clinic.slug && (!clinic.visibility || clinic.visibility === 'visible')).map(clinic => clinic.city),
    ))
    if (destination) permanentRedirect(destination)
    const initialPage = searchDirectory(pool, query)
    const routable = pool.filter(clinic => clinic.city && clinic.slug)
    const cityCounts = new Map<string, number>()
    for (const clinic of routable) {
      const key = clinic.city.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
      cityCounts.set(key, (cityCounts.get(key) ?? 0) + 1)
    }
    const hubs = aggregateLiveCityHubs(routable)
      .sort((a, b) => (cityCounts.get(b.slug) ?? 0) - (cityCounts.get(a.slug) ?? 0) || a.slug.localeCompare(b.slug))
      .slice(0, 12)
    const browse = <section aria-labelledby="browse-city-heading" className="mb-8 border-b border-onyx/10 pb-8">
      <h2 id="browse-city-heading" className="font-serif text-2xl text-onyx mb-3">Browse clinics by city</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-stone mb-5">Start with a local directory, then compare provider profiles, listed treatments, and contact details. Listings include unclaimed and unverified records; confirm services and credentials with the clinic before booking.</p>
      <nav aria-label="City directories" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
        {hubs.map(hub => <Link key={hub.slug} href={`/clinics/${hub.slug}`} className="text-sm text-sage underline underline-offset-4 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage">{citySlugToDisplay(hub.slug)}{hub.state ? `, ${hub.state}` : ''}</Link>)}
      </nav>
    </section>
    return <ClinicsClient key={serializeDirectoryQuery(initialPage.query).toString()} initialPage={initialPage} totalCount={routable.length} directoryMode browse={browse} />
  } catch (error) {
    if (!(error instanceof DirectoryQueryError)) {
      skipUnreachableDatabasePrerender()
      throw error
    }
    return <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl">Check your search filters</h1>
      <p role="alert" className="mt-4">{error.message}</p>
      <Link href="/clinics" className="inline-block mt-6 text-sage underline">Start a new search</Link>
    </main>
  }
}
