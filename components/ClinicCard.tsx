'use client'
import { useState } from 'react'
import { Clinic } from '@/types/clinic'
import TreatmentTag, { getTagVariant } from './TreatmentTag'
import VerifiedBadge from './VerifiedBadge'

interface ClinicCardProps { clinic: Clinic }

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-[13px] ${i <= Math.floor(rating) ? 'text-gold' : i - 0.5 <= rating ? 'text-gold opacity-60' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}

export function FeaturedClinicCard({ clinic }: ClinicCardProps) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="col-span-full">
      <div className="bg-white rounded-2xl border border-gold/35 shadow-featured hover:shadow-featured-hover hover:-translate-y-0.5 transition-all overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr]">
        <div className="h-[220px] bg-gradient-to-br from-[#bdd4e7] to-[#d4ecf5] flex items-center justify-center text-5xl">
          {clinic.imageUrl
            ? <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
            : clinic.logo
              ? <img src={clinic.logo} alt={clinic.name} className="max-w-[60%] max-h-[60%] object-contain opacity-80" />
              : '✨'
          }
        </div>
        <div className="p-5 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <VerifiedBadge className="static" />
                <span className="bg-gold text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">⭐ Featured</span>
              </div>
              <div className="text-lg font-bold text-navy tracking-tight">
                <a href={`/clinics/${clinic.city.toLowerCase()}/${clinic.slug}`} className="hover:text-teal transition-colors">{clinic.name}</a>
              </div>
            </div>
            <button onClick={() => setSaved(!saved)} className={`w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-colors flex-shrink-0 ${saved ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={clinic.googleRating} />
            <span className="text-sm font-bold text-navy">{clinic.googleRating}</span>
            <span className="text-xs text-gray-400">({clinic.googleReviewCount} reviews)</span>
            {clinic.availability && <span className="flex items-center gap-1 text-[11px] font-medium text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{clinic.availability}</span>}
          </div>
          {clinic.address && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {clinic.address}{clinic.distance && ` · ${clinic.distance} away`}
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.41 18 19.5 19.5 0 0 1 5 11.59a19.79 19.79 0 0 1-3.89-8.3A2 2 0 0 1 3.09 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>
              <a href={`tel:${clinic.phone}`} className="hover:text-teal transition-colors">{clinic.phone}</a>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {[...(clinic.treatments || []), ...(clinic.specialtyTreatments || [])].slice(0, 6).map(t => (
              <TreatmentTag key={t} label={t} variant={getTagVariant(t)} />
            ))}
          </div>
          {clinic.description && <p className="text-sm text-gray-500 leading-relaxed flex-1">{clinic.description}</p>}
          <div className="flex items-center gap-2.5 mt-auto">
            <a href={`/clinics/${clinic.city.toLowerCase()}/${clinic.slug}`} className="inline-block bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-navy transition-colors">View Full Profile</a>
            {clinic.bookingUrl
              ? <a href={clinic.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal bg-teal/[0.08] border border-teal/20 px-4 py-2.5 rounded hover:bg-teal/[0.15] transition-colors">Book Consultation</a>
              : <button className="text-sm font-semibold text-teal bg-teal/[0.08] border border-teal/20 px-4 py-2.5 rounded hover:bg-teal/[0.15] transition-colors">Book Consultation</button>
            }
            {clinic.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-400 hover:text-teal transition-colors ml-auto" title="Visit website">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
            )}
            {clinic.priceTier && <span className={`text-sm text-gray-500 ${!clinic.website ? 'ml-auto' : ''}`}><strong className="text-navy">{clinic.priceTier}</strong></span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClinicCard({ clinic }: ClinicCardProps) {
  const [saved, setSaved] = useState(false)
  return (
    <div className={`bg-white rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-[3px] ${
      clinic.featured
        ? 'border border-gold/35 shadow-featured hover:shadow-featured-hover'
        : 'border border-gray-200 shadow-sm hover:shadow-lg hover:border-teal/25'
    }`}>
      <div className="h-[168px] relative overflow-hidden bg-gradient-to-br from-[#c9d8e8] to-[#e0eff7]">
        {clinic.imageUrl
          ? <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
          : clinic.logo
            ? <img src={clinic.logo} alt={clinic.name} className="w-full h-full object-contain p-8" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">🏥</div>
        }
        {clinic.verified && <VerifiedBadge className="absolute top-2.5 left-2.5" />}
        {clinic.featured && <span className="absolute top-2.5 right-2.5 bg-gold text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">⭐ Featured</span>}
        {clinic.isNew && !clinic.featured && <span className="absolute top-2.5 right-2.5 bg-navy text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">New</span>}
        <button onClick={() => setSaved(!saved)} className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-colors ${saved ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <div className="text-[15px] font-bold text-navy tracking-tight leading-snug">
          <a href={`/clinics/${clinic.city.toLowerCase()}/${clinic.slug}`} className="hover:text-teal transition-colors">{clinic.name}</a>
        </div>
        <div className="flex items-center gap-1.5">
          <StarRating rating={clinic.googleRating} />
          <span className="text-sm font-bold text-navy">{clinic.googleRating}</span>
          <span className="text-xs text-gray-400">({clinic.googleReviewCount})</span>
        </div>
        {(clinic.neighborhood || clinic.city) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {clinic.neighborhood || clinic.city}{clinic.distance && ` · ${clinic.distance}`}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {[...(clinic.treatments || []), ...(clinic.specialtyTreatments || [])].slice(0, 4).map(t => (
            <TreatmentTag key={t} label={t} variant={getTagVariant(t)} />
          ))}
        </div>
        {clinic.availability && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{clinic.availability}
          </div>
        )}
        {clinic.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{clinic.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
        <a href={`/clinics/${clinic.city.toLowerCase()}/${clinic.slug}`} className="flex-1 text-center text-sm font-semibold text-white bg-teal px-3.5 py-2 rounded hover:bg-navy transition-colors">View Profile</a>
        {clinic.bookingUrl
          ? <a href={clinic.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal bg-teal/[0.08] border border-teal/20 px-3.5 py-2 rounded hover:bg-teal/[0.15] transition-colors">Book</a>
          : <button className="text-sm font-semibold text-teal bg-teal/[0.08] border border-teal/20 px-3.5 py-2 rounded hover:bg-teal/[0.15] transition-colors">Book</button>
        }
        {clinic.website && (
          <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-teal transition-colors" title="Visit website">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </a>
        )}
        {clinic.priceTier && <span className="text-xs text-gray-500 ml-auto"><strong className="text-navy font-semibold">{clinic.priceTier}</strong></span>}
      </div>
    </div>
  )
}
