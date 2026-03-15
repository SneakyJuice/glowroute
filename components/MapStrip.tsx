interface Props { city: string; radius: number }
export default function MapStrip({ city, radius }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center justify-between mb-5 gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">🗺️</span>
        <span className="text-[13px] text-gray-700"><strong className="font-semibold text-navy">{city}</strong> — showing results within {radius} miles</span>
      </div>
      <button className="text-[13px] font-semibold text-teal border border-teal px-3.5 py-[7px] rounded flex-shrink-0 hover:bg-teal hover:text-white transition-all">View on Map</button>
    </div>
  )
}
