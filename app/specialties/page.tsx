import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CATEGORIES } from '@/data/categories'
import { matchCategories } from '@/data/categories'
import { allClinics } from '@/data/all-clinics'
import type { CategorySlug } from '@/data/categories'
import SpecialtyGrid from '@/components/SpecialtyGrid'

export const metadata: Metadata = {
  title: 'Browse by Specialty | GlowRoute',
  description: 'Browse med spas and aesthetic clinics by specialty. Find the exact treatment you need from verified providers.',
  openGraph: {
    title: 'Browse by Specialty | GlowRoute',
    description: 'Browse med spas and aesthetic clinics by specialty. Find the exact treatment you need from verified providers.',
    type: 'website',
    siteName: 'GlowRoute',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse by Specialty | GlowRoute',
    description: 'Browse med spas and aesthetic clinics by specialty.',
  },
}

async function getCategoryCounts(): Promise<Record<CategorySlug, number>> {
  const counts = {} as Record<CategorySlug, number>
  // Init all to 0
  for (const cat of CATEGORIES) {
    counts[cat.slug as CategorySlug] = 0
  }
  // Count clinics per category
  for (const clinic of (await allClinics)) {
    const treatments = [...(clinic.treatments || []), ...(clinic.specialtyTreatments || [])]
    const matched = matchCategories(treatments)
    for (const slug of matched) {
      counts[slug] = (counts[slug] ?? 0) + 1
    }
  }
  return counts
}

export default async function SpecialtiesPage() {
  const counts = await getCategoryCounts()

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
        <SpecialtyGrid
          categories={CATEGORIES.map(cat => ({
            slug: cat.slug,
            icon: cat.icon,
            label: cat.label,
            count: counts[cat.slug as CategorySlug] ?? 0,
          }))}
        />
      </main>

      <Footer />
    </div>
  )
}
