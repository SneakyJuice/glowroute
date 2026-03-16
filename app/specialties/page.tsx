import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CATEGORIES } from '@/data/categories'
import { matchCategories } from '@/data/categories'
import { allClinics } from '@/data/all-clinics'
import type { CategorySlug } from '@/data/categories'

export const metadata: Metadata = {
  title: 'Specialties | GlowRoute',
  description: 'Browse Florida med spas and aesthetic clinics by specialty. Find the exact treatment you need from verified providers.',
}

function getCategoryCounts(): Record<CategorySlug, number> {
  const counts = {} as Record<CategorySlug, number>
  // Init all to 0
  for (const cat of CATEGORIES) {
    counts[cat.slug as CategorySlug] = 0
  }
  // Count clinics per category
  for (const clinic of allClinics) {
    const treatments = [...(clinic.treatments || []), ...(clinic.specialtyTreatments || [])]
    const matched = matchCategories(treatments)
    for (const slug of matched) {
      counts[slug] = (counts[slug] ?? 0) + 1
    }
  }
  return counts
}

export default function SpecialtiesPage() {
  const counts = getCategoryCounts()

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-onyx py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-[clamp(32px,5vw,56px)] font-light text-ivory leading-tight tracking-tight mb-4">
            Browse by Specialty
          </h1>
          <p className="text-base text-stone max-w-md mx-auto leading-relaxed">
            Discover the treatments transforming modern wellness
          </p>
        </div>
      </section>

      {/* Category Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const count = counts[cat.slug as CategorySlug] ?? 0
            return (
              <Link
                key={cat.slug}
                href={`/clinics?specialty=${cat.slug}`}
                className="bg-white border border-stone/20 hover:border-champagne/60 rounded-xl p-6 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-3 group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-onyx text-sm leading-snug group-hover:text-sage transition-colors">
                    {cat.label}
                  </p>
                </div>
                <span className="text-stone text-sm">{count} providers</span>
              </Link>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  )
}
