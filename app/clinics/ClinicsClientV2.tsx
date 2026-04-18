'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Clinic } from '@/types/clinic'
import ClinicsClient from './ClinicsClient'

/**
 * Wrapper that adds infinite-scroll "Load More" functionality via /api/clinics endpoint.
 * Reduces initial HTML payload from 7.8 MB to ~100 KB.
 * 
 * Flow:
 * 1. SSR renders first 25 clinics in HTML (lean, crawlable)
 * 2. Client hydrates and replaces with interactive ClinicsClient
 * 3. When user scrolls near bottom, fetch next page via /api/clinics
 * 4. Append to list and re-render
 *
 * IMPORTANT: allClinics (full dataset from SSR) is passed as the search/filter pool.
 * The `clinics` state (paginated display list) is only used for the visible card grid.
 * This ensures city/treatment search works across all ~14k clinics, not just the first 25.
 */
export default function ClinicsClientV2({
  allClinics,
  initialClinics,
  featuredClinic,
  totalCount,
}: {
  allClinics: Clinic[]
  initialClinics: Clinic[]
  featuredClinic: Clinic | null
  totalCount?: number
}) {
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(2) // Next page to fetch (we already have page 1)
  const [hasMore, setHasMore] = useState(initialClinics.length < allClinics.length)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Fetch next page via API
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/clinics?page=${page}&limit=25`)
      if (!res.ok) throw new Error('Failed to fetch')
      
      const { data, count, total } = await res.json()
      
      setClinics(prev => [...prev, ...data])
      setPage(prev => prev + 1)
      
      // Stop if we've fetched all
      if (clinics.length + count >= total) {
        setHasMore(false)
      }
    } catch (err) {
      console.error('[ClinicsClientV2] Load more error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore, clinics.length])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, isLoading])

  return (
    <>
      <ClinicsClient
        allClinics={allClinics}
        displayClinics={clinics}
        initialClinics={clinics}
        featuredClinic={featuredClinic}
        totalCount={totalCount ?? allClinics.length}
      />
      
      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="py-8 text-center">
          {isLoading && <p className="text-stone">Loading more clinics...</p>}
        </div>
      )}
    </>
  )
}
