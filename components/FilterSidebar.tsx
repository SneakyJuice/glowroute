'use client'
import { FilterState } from '@/types/clinic'
import { GOALS } from '@/lib/goals'
import taxonomy from '@/lib/taxonomy.json'

// Service filter tags pulled from taxonomy — canonical slugs + emoji labels
const SERVICE_FILTERS: { slug: string; label: string; emoji: string }[] =
  (taxonomy as any).serviceFilters || []

const RATINGS = [{ label: '4.5+ ★', value: 4.5 }, { label: '4.0+ ★', value: 4.0 }, { label: '3.5+ ★', value: 3.5 }, { label: 'Any', value: 0 }]
const PRICE_TIERS = ['$', '$$', '$$$', '$$$$']

const EMPTY_FILTERS: FilterState = {
  treatmentTypes: [], goals: [], distanceMiles: 25, minRating: 0,
  priceTiers: [], verifiedOnly: false, onlineBooking: false,
  telehealth: false, membershipPlans: false, freeConsultation: false,
}

interface Props { filters: FilterState; onChange: (f: FilterState) => void }

export default function FilterSidebar({ filters, onChange }: Props) {
  const toggleGoal = (slug: string) => {
    const active = (filters.goals || []).includes(slug)
    onChange({ ...filters, goals: active ? filters.goals.filter(g => g !== slug) : [...(filters.goals || []), slug] })
  }

  const toggleService = (slug: string) => {
    const active = (filters.treatmentTypes || []).includes(slug)
    onChange({ ...filters, treatmentTypes: active ? filters.treatmentTypes.filter(t => t !== slug) : [...(filters.treatmentTypes || []), slug] })
  }

  return (
    <aside className="hidden md:block bg-white rounded-2xl border border-gray-200 p-6 sticky top-20">
      <div className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.6px] mb-4">Refine</div>

      {/* ── Health Goals ──────────────────────────────────────────────── */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <span className="block text-[13px] font-semibold text-onyx mb-0.5">Health Goal</span>
        <span className="block text-[11px] text-gray-400 mb-2.5">What do you want to achieve?</span>
        <div className="flex flex-wrap gap-1.5">
          {GOALS.map(g => {
            const active = (filters.goals || []).includes(g.slug)
            return (
              <button
                key={g.slug}
                onClick={() => toggleGoal(g.slug)}
                className={`text-[12px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-sage/10 border-sage text-sage font-semibold'
                    : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-ivory hover:border-sage hover:text-sage'
                }`}
              >
                <span>{g.emoji}</span>
                <span>{g.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Treatment / Service Tags ───────────────────────────────────── */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <span className="block text-[13px] font-semibold text-onyx mb-0.5">Treatment</span>
        <span className="block text-[11px] text-gray-400 mb-2.5">Filter by specific service</span>
        <div className="flex flex-wrap gap-1.5">
          {SERVICE_FILTERS.map(svc => {
            const active = (filters.treatmentTypes || []).includes(svc.slug)
            return (
              <button
                key={svc.slug}
                onClick={() => toggleService(svc.slug)}
                className={`text-[12px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-sage/10 border-sage text-sage font-semibold'
                    : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-ivory hover:border-sage hover:text-sage'
                }`}
              >
                <span>{svc.emoji}</span>
                <span>{svc.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Minimum Rating ─────────────────────────────────────────────── */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <span className="block text-[13px] font-semibold text-onyx mb-2.5">Minimum Rating</span>
        <div className="flex flex-wrap gap-1.5">
          {RATINGS.map(r => (
            <button key={r.label} onClick={() => onChange({ ...filters, minRating: r.value })} className={`text-[12px] font-medium px-2.5 py-1 rounded-full border transition-all ${filters.minRating === r.value ? 'bg-sage/10 border-sage text-sage font-semibold' : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-sage hover:text-sage'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Price Range ─────────────────────────────────────────────────── */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <span className="block text-[13px] font-semibold text-onyx mb-2.5">Price Range</span>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_TIERS.map(p => (
            <button key={p} onClick={() => {
              const active = filters.priceTiers.includes(p)
              onChange({ ...filters, priceTiers: active ? filters.priceTiers.filter(x => x !== p) : [...filters.priceTiers, p] })
            }} className={`text-[12px] font-medium px-2.5 py-1 rounded-full border transition-all ${filters.priceTiers.includes(p) ? 'bg-sage/10 border-sage text-sage font-semibold' : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-sage hover:text-sage'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <span className="block text-[13px] font-semibold text-onyx mb-2.5">Features</span>
        {[
          { key: 'verifiedOnly', label: 'GlowRoute Verified' },
          { key: 'onlineBooking', label: 'Online Booking' },
          { key: 'telehealth', label: 'Telehealth Available' },
          { key: 'membershipPlans', label: 'Membership Plans' },
          { key: 'freeConsultation', label: 'Free Consultation' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between mb-2.5 last:mb-0">
            <span className="text-[13px] text-gray-700">{label}</span>
            <button onClick={() => onChange({ ...filters, [key]: !filters[key as keyof FilterState] })} className={`w-[34px] h-5 rounded-full relative transition-colors ${filters[key as keyof FilterState] ? 'bg-sage' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters[key as keyof FilterState] ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => onChange(EMPTY_FILTERS)}
        className="w-full text-[12px] font-semibold text-gray-500 py-2 text-center border border-dashed border-gray-200 rounded hover:text-sage hover:border-sage transition-colors mt-1"
      >
        Clear All Filters
      </button>
    </aside>
  )
}