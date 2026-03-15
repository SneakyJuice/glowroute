'use client'
import { useState, useMemo } from 'react'
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
import { featuredClinic, standardClinics } from '@/data/tampa-clinics'

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

export default function ClinicsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState('Best Match')
  const [page, setPage] = useState(1)

  const filteredClinics = useMemo(() => {
    let result = [...standardClinics]

    // Filter by minimum rating
    if (filters.minRating > 0) {
      result = result.filter(c => c.googleRating >= filters.minRating)
    }

    // Filter by price tier
    if (filters.priceTiers.length > 0) {
      result = result.filter(c => c.priceTier && filters.priceTiers.includes(c.priceTier))
    }

    // Filter by verified only
    if (filters.verifiedOnly) {
      result = result.filter(c => c.verified)
    }

    // Filter by treatment type (simplified — matches against treatments array)
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
      result.sort((a, b) => b.googleRating - a.googleRating)
    } else if (sort === 'Most Reviewed') {
      result.sort((a, b) => b.googleReviewCount - a.googleReviewCount)
    } else if (sort === 'Nearest First') {
      result.sort((a, b) => {
        const distA = parseFloat(a.distance || '99')
        const distB = parseFloat(b.distance || '99')
        return distA - distB
      })
    }

    return result
  }, [filters, sort])

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

  return (
    <div className="min-h-screen bg-cream font-sans">
      <Navbar />
      <HeroSearch clinicCount={60} defaultCity="Tampa, FL" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <MapStrip city="Tampa, FL" radius={filters.distanceMiles} />

            <ResultsHeader
              count={filteredClinics.length + 1}
              city="Tampa, FL"
              view={view}
              sort={sort}
              onViewChange={setView}
              onSortChange={handleSortChange}
            />

            <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {/* Featured card always first, full width */}
              <FeaturedClinicCard clinic={featuredClinic} />

              {/* Standard clinic cards */}
              {pagedClinics.map((clinic: Clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
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
