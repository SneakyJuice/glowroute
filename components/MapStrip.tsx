interface Props { city: string; radius: number }

export default function MapStrip({ city, radius }: Props) {
  // Build Google Maps search URL for the city
  const citySlug = city.replace(/,.*$/, '').trim() // "Tampa, FL" → "Tampa"
  const mapsUrl = `https://www.google.com/maps/search/medspa+clinic+near+${encodeURIComponent(citySlug)}+FL/`

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <svg className="w-[18px] h-[18px] text-sage flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <line x1="9" y1="3" x2="9" y2="18"/>
          <line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
        <span className="text-[13px] text-gray-700 truncate">
          <strong className="font-semibold text-onyx">{city}</strong> — showing results within {radius} miles
        </span>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] font-semibold text-sage border border-sage px-3.5 py-[7px] rounded flex-shrink-0 hover:bg-sage hover:text-white transition-all self-start sm:self-auto"
      >
        View on Map
      </a>
    </div>
  )
}
