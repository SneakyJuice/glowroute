'use client'

import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import HeroSearch from '@/components/HeroSearch'
import FilterSidebar from '@/components/FilterSidebar'
import ResultsHeader from '@/components/ResultsHeader'
import ClinicCard, { FeaturedClinicCard } from '@/components/ClinicCard'
import MapStrip from '@/components/MapStrip'
import BottomCTA from '@/components/BottomCTA'
import QuizCTA from '@/components/QuizCTA'
import Footer from '@/components/Footer'
import type { FilterState } from '@/types/clinic'
import { DIRECTORY_DEFAULT_FILTERS, parseDirectoryQuery, serializeDirectoryQuery } from '@/lib/directory-search'
import type { DirectoryPage, DirectoryQuery } from '@/lib/directory-search'

export interface ClinicsClientProps { initialPage: DirectoryPage; totalCount: number }

/** SSR and hydration use the same first page, with no hidden duplicate tree. */
export default function ClinicsClient({ initialPage, totalCount }: ClinicsClientProps) {
  const [result, setResult] = useState(initialPage)
  const [query, setQuery] = useState(initialPage.query)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const resultHeading = useRef<HTMLDivElement>(null)
  const initialKey = useRef(serializeDirectoryQuery(initialPage.query).toString())
  const queryKey = serializeDirectoryQuery(query).toString()

  useEffect(() => {
    const restore = () => {
      try { setQuery(parseDirectoryQuery(new URLSearchParams(window.location.search))) }
      catch { setError('This search link contains invalid filters. Clear the search to continue.') }
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])

  useEffect(() => {
    if (queryKey === initialKey.current && retry === 0) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch('/api/clinics?' + queryKey, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Clinic directory is temporarily unavailable. Please try again.')
        return payload as DirectoryPage
      })
      .then(payload => {
        if (controller.signal.aborted) return
        setResult(payload)
        resultHeading.current?.focus({ preventScroll: true })
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Search could not be loaded.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [queryKey, retry])

  function changeQuery(next: DirectoryQuery) {
    const normalized = parseDirectoryQuery(serializeDirectoryQuery(next))
    initialKey.current = ''
    setQuery(normalized)
    window.history.pushState(null, '', window.location.pathname + '?' + serializeDirectoryQuery(normalized))
    resultHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
  function clearSearch() {
    changeQuery({ ...query, q: '', specialty: '', page: 1, filters: { ...DIRECTORY_DEFAULT_FILTERS, distanceMiles: query.distance ?? 0 } })
  }
  function changeFilters(filters: FilterState) {
    changeQuery({ ...query, filters, distance: filters.distanceMiles || null, page: 1 })
  }
  const filtersActive = !!(query.q || query.specialty || query.filters.goals.length || query.filters.treatmentTypes.length || query.filters.minRating || query.filters.verifiedOnly || query.filters.onlineBooking)
  const currentResultMatches = serializeDirectoryQuery(result.query).toString() === queryKey
  const available = !error && (!loading || currentResultMatches)
  const pages = Array.from({ length: Math.min(result.totalPages, 5) }, (_, index) => Math.max(1, Math.min(result.page - 2, result.totalPages - 4)) + index)

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <HeroSearch key={[query.city, query.q, query.distance].join(':')} clinicCount={totalCount} defaultCity={query.city} defaultTreatment={query.q} defaultDistance={query.distance === null ? 'any' : String(query.distance)}
        onSearch={(q, city, distance) => changeQuery({ ...query, q, city, distance: distance === 'any' ? null : Number(distance), lat: undefined, lng: undefined, page: 1 })}
        onNearMe={(lat, lng) => changeQuery({ ...query, city: '', lat, lng, sort: 'Nearest First', page: 1 })} />
      <QuizCTA variant="banner" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex md:hidden justify-between items-center mb-4">
          <span className="text-sm text-stone">{loading ? 'Searching…' : result.total.toLocaleString() + ' providers'}</span>
          <button type="button" aria-expanded={mobileFiltersOpen} aria-controls="mobile-directory-filters" onClick={() => setMobileFiltersOpen(v => !v)} className="text-sm font-semibold border border-gray-300 rounded-full px-4 py-2 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage">Filters{filtersActive ? ' · Active' : ''}</button>
        </div>
        {mobileFiltersOpen && <div id="mobile-directory-filters" className="md:hidden mb-4"><FilterSidebar filters={query.filters} onChange={changeFilters} onClear={clearSearch} /></div>}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="hidden md:block w-64 flex-shrink-0"><FilterSidebar filters={query.filters} onChange={changeFilters} onClear={clearSearch} /></div>
          <div className="flex-1 min-w-0">
            <div ref={resultHeading} tabIndex={-1} className="scroll-mt-24 outline-none" aria-busy={loading}>
              <MapStrip city={result.cityLabel} radius={result.distanceApplied ? result.query.distance : null} locationNote={!result.distanceApplied && result.query.distance !== null ? 'Showing city matches; distance data unavailable' : undefined} />
              <ResultsHeader count={result.total} city={result.cityLabel} view={view} sort={query.sort} onViewChange={setView} onSortChange={sort => changeQuery({ ...query, sort, page: 1 })} />
            </div>
            {filtersActive && <div className="flex items-center justify-between gap-3 mb-4 text-sm text-stone"><span>Filters applied{query.q ? ': ' + query.q : ''}</span><button type="button" className="underline text-sage" onClick={clearSearch}>Clear search filters</button></div>}
            <div role="status" aria-live="polite" className="text-sm text-stone">{loading ? 'Loading matching providers…' : !error ? result.total.toLocaleString() + ' matching providers. Page ' + result.page + ' of ' + Math.max(result.totalPages, 1) + '.' : ''}</div>
            {error && <div role="alert" className="my-5 rounded-xl border border-stone/30 p-5 bg-white"><p>{error}</p><button type="button" onClick={() => setRetry(v => v + 1)} className="mt-3 text-sage underline">Try again</button><button type="button" onClick={clearSearch} className="mt-3 ml-5 text-sage underline">Clear filters</button></div>}
            {available && result.total === 0 && <div className="my-6 rounded-2xl border border-gray-200 bg-white p-8"><h2 className="font-serif text-2xl text-onyx">No providers match this search</h2><p className="text-stone mt-2">Try a different treatment, a nearby city, or a wider distance.</p><button type="button" onClick={clearSearch} className="mt-5 bg-sage text-white rounded px-4 py-2">Clear search filters</button></div>}
            {available && <div className={'grid gap-5 mt-4 ' + (view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1')}>
              {result.featuredClinic && <FeaturedClinicCard clinic={result.featuredClinic} />}
              {result.data.map(clinic => <ClinicCard key={clinic.id} clinic={clinic} />)}
            </div>}
            {available && result.totalPages > 1 && <nav aria-label="Provider result pages" className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {result.page > 1 && <a href={'?' + serializeDirectoryQuery({ ...query, page: result.page - 1 })} onClick={event => { event.preventDefault(); changeQuery({ ...query, page: result.page - 1 }) }} className="px-3 py-2 border rounded bg-white">Previous</a>}
              {pages.map(page => <a key={page} href={'?' + serializeDirectoryQuery({ ...query, page })} aria-current={result.page === page ? 'page' : undefined} onClick={event => { event.preventDefault(); changeQuery({ ...query, page }) }} className={'px-3 py-2 border rounded ' + (result.page === page ? 'bg-onyx text-white' : 'bg-white')}>{page}</a>)}
              {result.page < result.totalPages && <a href={'?' + serializeDirectoryQuery({ ...query, page: result.page + 1 })} onClick={event => { event.preventDefault(); changeQuery({ ...query, page: result.page + 1 }) }} className="px-3 py-2 border rounded bg-white">Next</a>}
            </nav>}
            <BottomCTA />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
