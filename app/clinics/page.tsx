'use client'
import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import HeroSearch from '@/components/HeroSearch'
import FilterSidebar from '@/components/FilterSidebar'
import ResultsHeader from '@/components/ResultsHeader'
import ClinicCard, { FeaturedClinicCard } from '@/components/ClinicCard'
import MapStrip from '@/components/MapStrip'
import Pagination from '@/components/Pagination'
import BottomCTA from '@/components/BottomCTA'
import Footer from '@/components/Footer'
import { FilterState, Clinic } from '@/types/clinic'
import { featuredClinic, standardClinics } from '@/data/all-clinics'
import { CATEGORIES, matchCategories } from '@/data/categories'
import type { CategorySlug } from '@/data/categories'
import { haversine } from '@/lib/geo'

const DEFAULT_FILTERS: FilterState = {
  treatmentTypes: [],
  distanceMiles: 25,
  minRating: 0,
  priceTiers: [],
  verifiedOnly: false,
  onlineBooking: false,
  telehealth: false,
  membershipPlans: false,
  freeConsultation: false,
}

const ITEMS_PER_PAGE = 6

function ClinicsPageInner() {
  const searchParams = useSearchParams()
  const specialtyParam = searchParams.get('specialty') as CategorySlug | null
  const activeSpecialty = specialtyParam
    ? CATEGORIES.find(c => c.slug === specialtyParam) ?? null
    : null

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState('Highest Rated')
  const [page, setPage] = useState(1)
  const [searchTreatment, setSearchTreatment] = useState('')
  const [searchCity, setSearchCity] = useState('Tampa')
  const [searchDistance, setSearchDistance] = useState('25')
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)

  const handleNearMe = (lat: number, lng: number) => {
    setUserLat(lat)
    setUserLng(lng)
    setSort('Nearest First')
    setPage(1)
  }


  const handleSearch = (treatment: string, city: string) => {
    setSearchTreatment(treatment.toLowerCase().trim())
    setSearchCity(city.toLowerCase().replace(',', '').trim())
    setPage(1)
  }

  const filteredClinics = useMemo(() => {
    let result = [...standardClinics]

    // SPECIALTY FILTER — pre-filter by category slug from ?specialty= param
    if (activeSpecialty) {
      result = result.filter(c => {
        const treatments = [...(c.treatments || []), ...(c.specialtyTreatments || [])]
        return matchCategories(treatments).includes(activeSpecialty.slug as CategorySlug)
      })
    }

    // TEXT SEARCH — treatment keyword against name, treatments, services, description
    if (searchTreatment) {
      result = result.filter(c => {
        const hay = [
          c.name,
          ...(c.treatments || []),
          ...(c.specialtyTreatments || []),
          c.description || '',
        ].join(' ').toLowerCase()
        return hay.includes(searchTreatment)
      })
    }

    // CITY FILTER — match against clinic city field
    if (searchCity && searchCity !== 'florida' && searchCity !== 'fl') {
      result = result.filter(c => {
        // Normalize both sides: strip ", FL", replace hyphens with spaces, lowercase
        const normalize = (s: string) => s.toLowerCase()
          .replace(/,?\s*(fl|florida)\s*/gi, '')
          .replace(/-/g, ' ')
          .replace(/st\.?\s+pete(rsburg)?/gi, 'st. petersburg')
          .trim()
        const clinicCity = normalize(c.city || '')
        const searchLower = normalize(searchCity)
        return clinicCity.includes(searchLower) || searchLower.includes(clinicCity)
      })
    }

    // Always exclude clinics with no rating data (broken scrape records)
    result = result.filter(c => c.googleRating > 0)

    // Existing filters (rating, price, verified, treatment type)
    if (filters.minRating > 0) {
      result = result.filter(c => c.googleRating >= filters.minRating)
    }
    if (filters.priceTiers.length > 0) {
      result = result.filter(c => c.priceTier && filters.priceTiers.includes(c.priceTier))
    }
    if (filters.verifiedOnly) {
      result = result.filter(c => c.verified)
    }
    if (filters.treatmentTypes.length > 0 && !filters.treatmentTypes.includes('All Treatments')) {
      result = result.filter(c => {
        const allTreatments = [...(c.treatments || []), ...(c.specialtyTreatments || [])]
        return filters.treatmentTypes.some(ft =>
          allTreatments.some(t => t.toLowerCase().includes(ft.toLowerCase()))
        )
      })
    }

    // Sort
    if (sort === 'Highest Rated') {
      // Weighted score: penalises high rating with 0 reviews (fake/placeholder data)
      // Score = rating × log10(reviews + 2) — a 4.8/500 review clinic beats 5.0/0 reviews
      const score = (c: { googleRating: number; googleReviewCount: number }) =>
        c.googleRating * Math.log10(c.googleReviewCount + 2)
      result.sort((a, b) => score(b) - score(a))
    } else if (sort === 'Most Reviewed') {
      result.sort((a, b) => b.googleReviewCount - a.googleReviewCount)
    } else if (sort === 'Nearest First') {
      if (userLat !== null && userLng !== null) {
        result.sort((a, b) => {
          const distA = a.lat != null && a.lng != null ? haversine(userLat, userLng, a.lat, a.lng) : 9999
          const distB = b.lat != null && b.lng != null ? haversine(userLat, userLng, b.lat, b.lng) : 9999
          return distA - distB
        })
      } else {
        result.sort((a, b) => {
          const distA = parseFloat(a.distance || '99')
          const distB = parseFloat(b.distance || '99')
          return distA - distB
        })
      }
    }

    return result
  }, [filters, sort, searchTreatment, searchCity, userLat, userLng, activeSpecialty])

  // Featured clinic is Tampa-only — hide when user has searched for another city
  const showFeatured = !searchCity || searchCity.toLowerCase().includes('tampa')
  const resultCount = filteredClinics.length + (showFeatured ? 1 : 0)

  const totalPages = Math.ceil(filteredClinics.length / ITEMS_PER_PAGE)
  const pagedClinics = filteredClinics.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    setPage(1)
  }

  // Display-friendly city label for UI components
  const displayCity = searchCity
    ? searchCity.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ', FL'
    : 'Tampa, FL'

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <HeroSearch clinicCount={standardClinics.length + 1} defaultCity="Tampa, FL" onSearch={handleSearch} onNearMe={handleNearMe} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {activeSpecialty && (
              <div className="mb-4 flex items-center gap-2.5">
                <span className="text-2xl">{activeSpecialty.icon}</span>
                <div>
                  <p className="text-xs text-stone uppercase tracking-wider font-medium">Showing results for</p>
                  <p className="text-base font-semibold text-onyx">{activeSpecialty.label}</p>
                </div>
                <a href="/clinics" className="ml-auto text-xs text-stone hover:text-sage border border-stone/20 hover:border-sage/40 rounded-full px-3 py-1 transition-colors">
                  Clear filter ✕
                </a>
              </div>
            )}

            <MapStrip city={displayCity} radius={filters.distanceMiles} />

            <ResultsHeader
              count={resultCount}
              city={displayCity}
              view={view}
              sort={sort}
              onViewChange={setView}
              onSortChange={handleSortChange}
            />

            <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {/* Featured card — only shown when city context matches Tampa */}
              {showFeatured && <FeaturedClinicCard clinic={featuredClinic} />}

              {/* Standard clinic cards */}
              {pagedClinics.map((clinic: Clinic) => {
                const distMi = userLat !== null && userLng !== null && clinic.lat != null && clinic.lng != null
                  ? haversine(userLat, userLng, clinic.lat, clinic.lng)
                  : undefined
                return <ClinicCard key={clinic.id} clinic={clinic} distanceMi={distMi} />
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            )}

            <BottomCTA />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ClinicsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory flex items-center justify-center"><p className="text-stone">Loading...</p></div>}>
      <ClinicsPageInner />
    </Suspense>
  )
}
