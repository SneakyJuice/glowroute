'use client'
import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface HeroSearchProps {
  clinicCount?: number
  defaultCity?: string
  onSearch?: (treatment: string, city: string, distance: string) => void
  onNearMe?: (lat: number, lng: number) => void
}

export default function HeroSearch({ clinicCount = 4980, defaultCity = 'Tampa, FL', onSearch, onNearMe }: HeroSearchProps) {
  const [treatment, setTreatment] = useState('')
  const [city, setCity] = useState(defaultCity)
  const [distance, setDistance] = useState('25')
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
      (err) => {
        setLocating(false)
        setLocError('Could not get location. Please allow access.')
      },
      { timeout: 10000 }
    )
  }

  const handleSearch = () => {
    onSearch?.(treatment, city, distance)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <section className="relative bg-onyx py-[52px] px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(201,169,110,0.06),transparent)] pointer-events-none" />
      <div className="max-w-[820px] mx-auto text-center relative">
        <div className="inline-flex items-center gap-1.5 bg-champagne/15 border border-champagne/30 text-champagne rounded-full text-[12px] font-semibold uppercase tracking-[0.4px] px-3 py-[5px] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-champagne animate-pulse" />
          {clinicCount}+ Verified Clinics
        </div>
        <h1 className="font-serif text-[clamp(28px,5vw,48px)] font-light text-white leading-[1.18] tracking-tight mb-3.5">
          Discover your{' '}
          <em className="font-normal text-champagne italic">aesthetic wellness.</em>
        </h1>
        <p className="text-base text-white/65 max-w-[520px] mx-auto mb-8 leading-relaxed">
          The curated directory of medspas and aesthetic clinics — verified providers, real results.
        </p>
        <div className="bg-white rounded-2xl shadow-lg flex flex-col sm:flex-row overflow-hidden">
          <div className="flex-1 flex items-center gap-2.5 px-4 border-b border-gray-200 sm:border-b-0 sm:border-r">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none outline-none text-sm text-onyx bg-transparent py-[18px] placeholder:text-gray-400"
              placeholder="Treatment, e.g. Botox, Semaglutide…"
            />
          </div>
          <div className="flex items-center gap-2.5 px-4 border-b border-gray-200 sm:border-b-0 sm:border-r sm:max-w-[220px]">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <input
              list="fl-cities"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none outline-none text-sm text-onyx bg-transparent py-[18px] placeholder:text-gray-400 min-w-0"
              placeholder="Tampa, FL"
            />
            <datalist id="fl-cities">
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
          <div className="flex items-center gap-2.5 px-4 border-b border-gray-200 sm:border-b-0 sm:max-w-[160px]">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <select value={distance} onChange={e => setDistance(e.target.value)} className="flex-1 border-none outline-none text-sm text-onyx bg-transparent appearance-none cursor-pointer py-[18px] sm:py-0">
              <option value="5">Within 5 mi</option>
              <option value="10">Within 10 mi</option>
              <option value="25">Within 25 mi</option>
              <option value="50">Any distance</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="bg-sage text-white text-[15px] font-semibold px-7 py-4 sm:py-0 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
          {['Verified providers', 'Curated results', 'Transparent pricing', 'Always free'].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[12px] font-medium text-white/55">
              <svg className="w-3 h-3 text-champagne" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {item}
            </div>
          ))}
          <button
            onClick={handleNearMe}
            disabled={locating}
            className="flex items-center gap-1.5 text-[12px] font-medium text-sage border border-sage/30 hover:bg-sage/10 rounded-full px-3 py-1.5 transition-colors disabled:opacity-60"
          >
            <span>{locating ? '⏳' : '📍'}</span>
            {locating ? 'Locating…' : 'Near Me'}
          </button>
        </div>
        {locError && (
          <p className="text-center text-[11px] text-red-400 mt-2">{locError}</p>
        )}
      </div>
    </section>
  )
}
