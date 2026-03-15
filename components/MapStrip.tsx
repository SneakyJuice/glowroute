interface Props { city: string; radius: number }

export default function MapStrip({ city, radius }: Props) {
  // Build Google Maps search URL for the city
  const citySlug = city.replace(/,.*$/, '').trim() // "Tampa, FL" → "Tampa"
  const mapsUrl = `https://www.google.com/maps/search/medspa+clinic+near+${encodeURIComponent(citySlug)}+FL/`

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-lg flex-shrink-0">🗺️</span>
        <span className="text-[13px] text-gray-700 truncate">
          <strong className="font-semibold text-navy">{city}</strong> — showing results within {radius} miles
        </span>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] font-semibold text-teal border border-teal px-3.5 py-[7px] rounded flex-shrink-0 hover:bg-teal hover:text-white transition-all self-start sm:self-auto"
      >
        View on Map
      </a>
    </div>
  )
}
