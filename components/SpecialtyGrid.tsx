'use client'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

interface CategoryItem {
  slug: string
  icon: string
  label: string
  count: number
}

interface SpecialtyGridProps {
  categories: CategoryItem[]
}

export default function SpecialtyGrid({ categories }: SpecialtyGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map(cat => (
        <Link
          key={cat.slug}
          href={`/clinics?specialty=${cat.slug}`}
          onClick={() => trackEvent.specialtyClick(cat.slug)}
          className="bg-white border border-stone/20 hover:border-champagne/60 rounded-xl p-6 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-3 group"
        >
          <span className="text-3xl">{cat.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-onyx text-sm leading-snug group-hover:text-sage transition-colors">
              {cat.label}
            </p>
          </div>
          <span className="text-stone text-sm">{cat.count} providers</span>
        </Link>
      ))}
    </div>
  )
}
