'use client'
import { useState } from 'react'

interface HeroSearchProps {
  clinicCount?: number
  defaultCity?: string
  onSearch?: (treatment: string, city: string, distance: string) => void
}

export default function HeroSearch({ clinicCount = 292, defaultCity = 'Tampa, FL', onSearch }: HeroSearchProps) {
  const [treatment, setTreatment] = useState('')
  const [city, setCity] = useState(defaultCity)
  const [distance, setDistance] = useState('25')

  const handleSearch = () => {
    if (onSearch) onSearch(treatment.trim(), city.trim(), distance)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <section className="relative bg-gradient-to-br from-navy via-navy-mid to-[#1a3a50] py-8 md:py-[52px] px-4 md:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(2,192,154,0.07),transparent)] pointer-events-none" />
      <div className="max-w-[820px] mx-auto text-center relative">

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-teal-light/15 border border-teal-light/30 text-teal-light rounded-full text-[12px] font-semibold uppercase tracking-[0.4px] px-3 py-[5px] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-light animate-pulse" />
          {clinicCount} Verified Florida Clinics
        </div>

        {/* Headline */}
        <h1 className="font-serif text-[clamp(24px,5vw,44px)] font-bold text-white leading-[1.18] tracking-tight mb-2 md:mb-3.5">
          Find your clinic.{' '}
          <em className="not-italic text-teal-light">Trust your results.</em>
        </h1>

        {/* Subtext — hidden on small mobile */}
        <p className="hidden sm:block text-base text-white/65 max-w-[520px] mx-auto mb-6 leading-relaxed">
          The most comprehensive directory of medspas and aesthetic clinics — real reviews, verified credentials, transparent pricing.
        </p>

        {/* Search bar — always 3 rows on mobile, inline on desktop */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-4">

          {/* Row 1: Treatment */}
          <div className="flex items-center gap-2.5 px-4 border-b border-gray-100">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none outline-none text-sm text-navy bg-transparent py-4 placeholder:text-gray-400"
              placeholder="Treatment, e.g. Botox, Semaglutide…"
            />
          </div>

          {/* Row 2: City */}
          <div className="flex items-center gap-2.5 px-4 border-b border-gray-100">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none outline-none text-sm text-navy bg-transparent py-4 placeholder:text-gray-400"
              placeholder="City, e.g. Tampa, Miami, Orlando"
            />
          </div>

          {/* Row 3: Distance + Search button */}
          <div className="flex items-center">
            <div className="flex items-center gap-2.5 px-4 flex-1 border-r border-gray-100">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
              <select
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className="flex-1 border-none outline-none text-sm text-navy bg-transparent appearance-none cursor-pointer py-4"
              >
                <option value="5">Within 5 mi</option>
                <option value="10">Within 10 mi</option>
                <option value="25">Within 25 mi</option>
                <option value="50">Any distance</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-br from-teal to-teal-light text-white text-[15px] font-semibold px-6 py-4 flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Search
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 md:gap-6 mt-4 flex-wrap">
          {['Verified clinics only', 'Real patient reviews', 'Transparent pricing', 'Free to use'].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[11px] md:text-[12px] font-medium text-white/55">
              <svg className="w-3 h-3 text-teal-light flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
