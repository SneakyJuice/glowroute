interface Props {
  city: string
  radius?: number | null
  locationNote?: string
}

export default function MapStrip({ city, radius, locationNote }: Props) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`medspa clinic near ${city}`)}`
  const distanceNote = locationNote || (radius != null && Number.isFinite(radius) && radius > 0
    ? `Within ${radius} miles of the search center`
    : 'No distance limit')

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <svg aria-hidden="true" className="w-[18px] h-[18px] mt-0.5 text-sage flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <path d="M9 3v18M15 6v15"/>
        </svg>
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong className="font-semibold text-onyx">{city}</strong>
          <span className="block text-xs text-gray-600">{distanceNote}</span>
        </p>
      </div>
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center min-h-11 text-sm font-semibold text-sage border border-sage px-3.5 py-2 rounded flex-shrink-0 hover:bg-sage hover:text-white transition-colors self-start sm:self-auto">
        Search Google Maps<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  )
}
