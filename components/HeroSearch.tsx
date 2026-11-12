'use client'
import { useId, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface HeroSearchProps {
  clinicCount?: number
  defaultCity?: string
  defaultTreatment?: string
  defaultDistance?: string
  onSearch?: (treatment: string, city: string, distance: string) => void
  onNearMe?: (lat: number, lng: number) => void
}

export default function HeroSearch({ clinicCount, defaultCity = 'Tampa, FL', defaultTreatment = '', defaultDistance = '25', onSearch, onNearMe }: HeroSearchProps) {
  const searchId = useId()
  const [treatment, setTreatment] = useState(defaultTreatment)
  const [city, setCity] = useState(defaultCity)
  const [distance, setDistance] = useState(defaultDistance)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  const handleNearMe = () => {
    trackEvent.nearMeClick()
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onNearMe?.(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setLocating(false)
        setLocError('Location unavailable. Search by city above, or allow location access and try again.')
      },
      { timeout: 10000 }
    )
  }

  const handleSearch = () => {
    onSearch?.(treatment, city, distance)
  }

  return (
    <section className="relative bg-onyx py-[52px] px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(201,169,110,0.06),transparent)] pointer-events-none" />
      <div className="max-w-[820px] mx-auto text-center relative">
        <div className="inline-flex items-center gap-1.5 bg-champagne/15 border border-champagne/30 text-champagne rounded-full text-[12px] font-semibold uppercase tracking-[0.4px] px-3 py-[5px] mb-5">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-champagne" />
          {typeof clinicCount === 'number' ? `${clinicCount.toLocaleString('en-US')} clinic listings` : 'Explore clinic listings'}
        </div>
        <h1 className="font-serif text-[clamp(28px,5vw,48px)] font-light text-white leading-[1.18] tracking-tight mb-3.5">
          Discover your{' '}
          <em className="font-normal text-champagne italic">aesthetic wellness.</em>
        </h1>
        <p className="text-base text-white/65 max-w-[520px] mx-auto mb-8 leading-relaxed">
          Explore medspas and aesthetic clinics. Compare listed services and find your next provider.
        </p>
        <form action="/clinics" method="get" role="search" aria-label="Find clinics" onSubmit={event => { if (onSearch) { event.preventDefault(); handleSearch() } }} className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 min-w-0 flex items-center gap-2.5 px-4 border-b border-gray-200 md:border-b-0 md:border-r focus-within:ring-2 focus-within:ring-inset focus-within:ring-sage">
            <svg aria-hidden="true" className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              id={`${searchId}-treatment`}
              aria-label="Treatment or clinic name"
              name="q"
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              className="flex-1 min-w-0 w-full border-none text-base text-onyx bg-transparent py-[18px] placeholder:text-gray-500"
              placeholder="Treatment, e.g. Botox, Semaglutide…"
            />
          </div>
          <div className="min-w-0 flex items-center gap-2.5 px-4 border-b border-gray-200 md:border-b-0 md:border-r md:w-[190px] focus-within:ring-2 focus-within:ring-inset focus-within:ring-sage">
            <svg aria-hidden="true" className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <input
              id={`${searchId}-city`}
              aria-label="City"
              name="city"
              list={`${searchId}-cities`}
              value={city}
              onChange={e => setCity(e.target.value)}
              className="flex-1 w-full border-none text-base text-onyx bg-transparent py-[18px] placeholder:text-gray-500 min-w-0"
              placeholder="Tampa, FL"
            />
            <datalist id={`${searchId}-cities`}>
              <option value="Tampa, FL" />
              <option value="Miami, FL" />
              <option value="Orlando, FL" />
              <option value="Fort Lauderdale, FL" />
              <option value="Jacksonville, FL" />
              <option value="Boca Raton, FL" />
              <option value="Clearwater, FL" />
              <option value="West Palm Beach, FL" />
              <option value="Sarasota, FL" />
              <option value="Naples, FL" />
              <option value="Fort Myers, FL" />
              <option value="Bradenton, FL" />
              <option value="Coral Gables, FL" />
              <option value="Hollywood, FL" />
              <option value="Pembroke Pines, FL" />
              <option value="Port St. Lucie, FL" />
              <option value="Coral Springs, FL" />
              <option value="Plantation, FL" />
              <option value="Doral, FL" />
              <option value="Weston, FL" />
              <option value="Aventura, FL" />
              <option value="Delray Beach, FL" />
              <option value="Boynton Beach, FL" />
              <option value="Palm Beach Gardens, FL" />
              <option value="Tallahassee, FL" />
              <option value="Gainesville, FL" />
              <option value="Pensacola, FL" />
              <option value="Daytona Beach, FL" />
              <option value="Melbourne, FL" />
              <option value="Lakeland, FL" />
              <option value="Kissimmee, FL" />
              <option value="St. Petersburg, FL" />
            </datalist>
          </div>
          <div className="min-w-0 flex items-center gap-2.5 px-4 border-b border-gray-200 md:border-b-0 md:w-[180px] focus-within:ring-2 focus-within:ring-inset focus-within:ring-sage">
            <svg aria-hidden="true" className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <select aria-label="Search distance" name="radius" value={distance} onChange={e => setDistance(e.target.value)} className="flex-1 min-w-0 border-none text-base text-onyx bg-transparent cursor-pointer py-[18px] md:py-0 min-h-11">
              <option value="5">Within 5 mi</option>
              <option value="10">Within 10 mi</option>
              <option value="25">Within 25 mi</option>
              <option value="any">Any distance</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-sage text-white text-[15px] font-semibold px-7 py-4 md:py-0 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
        </form>
        <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
          {['Explore treatments', 'Compare listings', 'Free to browse'].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[12px] font-medium text-white/75">
              <svg aria-hidden="true" className="w-3 h-3 text-champagne" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {item}
            </div>
          ))}
          <button
            id="search-location"
            type="button"
            onClick={handleNearMe}
            disabled={locating}
            aria-busy={locating}
            className="min-h-11 flex items-center gap-1.5 text-sm font-medium text-champagne border border-champagne/50 hover:bg-champagne/10 rounded-full px-4 py-2 transition-colors disabled:opacity-60"
          >
            <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {locating ? 'Locating…' : 'Near Me'}
          </button>
        </div>
        {locError && (
          <p role="status" className="text-center text-sm text-red-300 mt-2">{locError}</p>
        )}
      </div>
    </section>
  )
}
