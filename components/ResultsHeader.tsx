'use client'
interface Props { count: number; city: string; activeFilters?: string[]; view: 'grid'|'list'; sort: string; onViewChange: (v: 'grid'|'list') => void; onSortChange: (s: string) => void }
export default function ResultsHeader({ count, city, view, sort, onViewChange, onSortChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2.5">
      <div>
        <div className="text-[15px] text-gray-700"><strong className="font-bold text-navy">{count} clinics</strong> found near {city}</div>
        <div className="text-xs text-gray-400 mt-0.5">Showing verified clinics · sorted by best match</div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex gap-0.5">
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => onViewChange(v)} className={`p-[7px] rounded border transition-all ${view === v ? 'bg-white border-gray-200 text-navy shadow-sm' : 'border-transparent text-gray-400 hover:text-navy'}`}>
              {v === 'grid' ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => onSortChange(e.target.value)} className="text-[13px] font-medium text-navy border border-gray-200 rounded px-2.5 py-[7px] appearance-none bg-white outline-none cursor-pointer">
          {['Best Match', 'Highest Rated', 'Most Reviewed', 'Nearest First', 'Price: Low to High'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    </div>
  )
}
