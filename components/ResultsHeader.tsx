'use client'

interface Props {
  count: number
  city: string
  activeFilters?: string[]
  view: 'grid' | 'list'
  sort: string
  onViewChange: (view: 'grid' | 'list') => void
  onSortChange: (sort: string) => void
}

const SORT_OPTIONS = ['GlowScore™', 'Most Reviewed', 'Nearest First']

export default function ResultsHeader({ count, city, view, sort, onViewChange, onSortChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4 gap-3">
      <div role="status" aria-live="polite">
        <div className="text-[15px] text-gray-700">
          <strong className="font-bold text-onyx">{count.toLocaleString('en-US')} {count === 1 ? 'listing' : 'listings'}</strong> in {city}
        </div>
        <div className="text-xs text-gray-600 mt-1">Sorted by {sort === 'GlowScore™' ? 'GlowScore™' : sort.toLowerCase()}</div>
      </div>
      <div className="flex items-center gap-3">
        <div role="group" aria-label="Results layout" className="flex gap-1">
          {(['grid', 'list'] as const).map(layout => (
            <button key={layout} type="button" aria-label={layout === 'grid' ? 'Grid view' : 'List view'} aria-pressed={view === layout} onClick={() => onViewChange(layout)} className={`w-11 h-11 inline-flex items-center justify-center rounded border transition-colors ${view === layout ? 'bg-white border-gray-300 text-onyx shadow-sm' : 'border-transparent text-gray-600 hover:text-onyx'}`}>
              {layout === 'grid' ? (
                <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              ) : (
                <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              )}
            </button>
          ))}
        </div>
        <select aria-label="Sort clinic listings" value={sort} onChange={event => onSortChange(event.target.value)} className="min-h-11 min-w-0 max-w-full text-sm font-medium text-onyx border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer">
          {SORT_OPTIONS.map(option => <option key={option}>{option}</option>)}
        </select>
      </div>
    </div>
  )
}
