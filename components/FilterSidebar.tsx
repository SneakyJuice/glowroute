'use client'

import type { FilterState } from '@/types/clinic'
import { GOALS } from '@/lib/goals'
import taxonomy from '@/lib/taxonomy.json'

const SERVICE_FILTERS: { slug: string; label: string }[] = taxonomy.serviceFilters || []

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear?: () => void
}

export default function FilterSidebar({ filters, onChange, onClear }: Props) {
  const toggleGoal = (slug: string) => {
    const goals = filters.goals || []
    onChange({ ...filters, goals: goals.includes(slug) ? goals.filter(goal => goal !== slug) : [...goals, slug] })
  }

  const toggleService = (slug: string) => {
    const services = filters.treatmentTypes || []
    onChange({ ...filters, treatmentTypes: services.includes(slug) ? services.filter(service => service !== slug) : [...services, slug] })
  }

  const chipClass = (active: boolean) => `min-h-11 text-[13px] font-medium px-3 py-2 rounded-full border transition-colors ${active
    ? 'bg-sage/10 border-sage text-sage font-semibold'
    : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-ivory hover:border-sage hover:text-sage'}`

  return (
    <aside aria-label="Filter clinic listings" className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6">
      <h2 className="text-[13px] font-bold text-gray-600 uppercase tracking-[0.6px] mb-4">Refine your search</h2>

      <fieldset className="mb-6 pb-6 border-b border-gray-100">
        <legend className="text-sm font-semibold text-onyx mb-1">Health goal</legend>
        <p className="text-xs text-gray-600 mb-3">What do you want to achieve?</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(goal => {
            const active = (filters.goals || []).includes(goal.slug)
            return (
              <button key={goal.slug} type="button" aria-pressed={active} onClick={() => toggleGoal(goal.slug)} className={chipClass(active)}>
                {goal.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="mb-6 pb-6 border-b border-gray-100">
        <legend className="text-sm font-semibold text-onyx mb-1">Treatment</legend>
        <p className="text-xs text-gray-600 mb-3">Filter by listed service</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_FILTERS.map(service => (
            <button key={service.slug} type="button" aria-pressed={(filters.treatmentTypes || []).includes(service.slug)} onClick={() => toggleService(service.slug)} className={chipClass((filters.treatmentTypes || []).includes(service.slug))}>
              {service.label}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="mb-6 pb-6 border-b border-gray-100 text-sm text-gray-600 leading-relaxed">
        Ratings are being rechecked. Contact clinics to confirm current services.
      </p>

      <fieldset className="mb-4">
        <legend className="text-sm font-semibold text-onyx mb-2">Features</legend>
        {([
          { key: 'verifiedOnly', label: 'GlowRoute verified' },
          { key: 'onlineBooking', label: 'Online booking link' },
        ] as const).map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between gap-3 min-h-11 py-2 text-sm text-gray-700 cursor-pointer">
            <span>{label}</span>
            <input type="checkbox" checked={filters[key]} onChange={event => onChange({ ...filters, [key]: event.target.checked })} className="h-5 w-5 flex-shrink-0 accent-sage" />
          </label>
        ))}
        <p className="text-xs text-gray-600 leading-relaxed mt-3">Confirm current prices, telehealth, memberships and consultations with the clinic.</p>
      </fieldset>

      <button type="button" onClick={() => {
        if (onClear) {
          onClear()
        } else {
          onChange({
            ...filters,
            treatmentTypes: [], goals: [], minRating: 0, priceTiers: [],
            verifiedOnly: false, onlineBooking: false, telehealth: false,
            membershipPlans: false, freeConsultation: false,
          })
        }
      }} className="w-full min-h-11 text-sm font-semibold text-gray-600 px-3 py-2 text-center border border-dashed border-gray-300 rounded hover:text-sage hover:border-sage transition-colors mt-1">
        Clear filters
      </button>
    </aside>
  )
}
