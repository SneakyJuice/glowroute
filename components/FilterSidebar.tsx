'use client'
import { FilterState } from '@/types/clinic'

const TREATMENT_TYPES = ['All Treatments', 'Injectables', 'Body Contouring', 'Laser & Skin', 'Weight Loss', 'Peptide Therapy', 'IV Therapy', 'Hair Restoration', "Men's Health"]
const RATINGS = [{ label: '4.5+ ★', value: 4.5 }, { label: '4.0+ ★', value: 4.0 }, { label: '3.5+ ★', value: 3.5 }, { label: 'Any', value: 0 }]
const PRICE_TIERS = ['$', '$$', '$$$', '$$$$']

interface Props { filters: FilterState; onChange: (f: FilterState) => void }
export default function FilterSidebar({ filters, onChange }: Props) {
  return (
    <aside className="hidden md:block bg-white rounded-2xl border border-gray-200 p-6 sticky top-20">
      <div className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.6px] mb-4">Refine</div>
      <div className="mb-6 pb-6 border-b border-gray-100">
        <span className="block text-[13px] font-semibold text-onyx mb-2.5">Specialty</span>
        <div className="flex flex-wrap gap-1.5">
          {TREATMENT_TYPES.map(t => (
            <button key={t} onClick={() => {
              const active = filters.treatmentTypes.includes(t)
              onChange({ ...filters, treatmentTypes: active ? filters.treatmentTypes.filter(x => x !== t) : [...filters.treatmentTypes, t] })
            }} className={`text-[12px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all ${filters.treatmentTypes.includes(t) ? 'bg-sage/10 border-sage text-sage font-semibold' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-ivory hover:border-sage hover:text-sage'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
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
      <button onClick={() => onChange({ treatmentTypes: [], distanceMiles: 25, minRating: 0, priceTiers: [], verifiedOnly: false, onlineBooking: false, telehealth: false, membershipPlans: false, freeConsultation: false })} className="w-full text-[12px] font-semibold text-gray-500 py-2 text-center border border-dashed border-gray-200 rounded hover:text-sage hover:border-sage transition-colors mt-1">
        Clear All Filters
      </button>
    </aside>
  )
}
