'use client'
import { useState } from 'react'
import { Clinic } from '@/types/clinic'
import TreatmentTag, { getTagVariant } from './TreatmentTag'
import VerifiedBadge from './VerifiedBadge'
import { getCardVibeTags, VIBE_STYLES } from '@/lib/vibes'
import type { VibeTag } from '@/lib/vibes'
import { detectInfluencer, getInfluencerTier } from '@/lib/influencer'
import CreatorBadge from './CreatorBadge'

function getMapUrl(clinic: Clinic): string {
  const lat = (clinic as any).lat
  const lng = (clinic as any).lng
  if (lat != null && lng != null) {
    return `https://maps.google.com/?q=${lat},${lng}`
  }
  const query = clinic.address || `${clinic.name} ${clinic.city} FL`
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`
}

function ViewOnMapButton({ clinic, className = '' }: { clinic: Clinic; className?: string }) {
  return (
    <a
      href={getMapUrl(clinic)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center text-stone hover:text-sage transition-colors ${className}`}
      title="View on Google Maps"
      aria-label="View on Google Maps"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    </a>
  )
}

function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

interface ClinicCardProps { clinic: Clinic; distanceMi?: number }

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-[13px] ${i <= Math.floor(rating) ? 'text-champagne' : i - 0.5 <= rating ? 'text-champagne opacity-60' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}

export function FeaturedClinicCard({ clinic }: ClinicCardProps) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="col-span-full">
      <div className="bg-white rounded-2xl border border-champagne/35 shadow-featured hover:shadow-featured-hover hover:-translate-y-0.5 transition-all overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr]">
        <div className="h-[220px] bg-gradient-to-br from-[#bdd4e7] to-[#d4ecf5] flex items-center justify-center text-5xl">
          {clinic.imageUrl || clinic.images?.[0]
            ? <img src={clinic.imageUrl || clinic.images?.[0]} alt={clinic.name} className="w-full h-full object-cover" />
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
                <span className="bg-champagne text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">⭐ Featured</span>
              </div>
              <div className="text-lg font-bold text-onyx tracking-tight">
                <a href={`/clinics/${citySlug(clinic.city)}/${clinic.slug}`} className="hover:text-sage transition-colors">{clinic.name}</a>
              </div>
            </div>
            <button onClick={() => setSaved(!saved)} className={`w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-colors flex-shrink-0 ${saved ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={clinic.googleRating} />
            <span className="text-sm font-bold text-onyx">{clinic.googleRating}</span>
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
              <a href={`tel:${clinic.phone}`} className="hover:text-sage transition-colors">{clinic.phone}</a>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {[...(clinic.treatments || []), ...(clinic.specialtyTreatments || [])].slice(0, 6).map(t => (
              <TreatmentTag key={t} label={t} variant={getTagVariant(t)} />
            ))}
          </div>
          {clinic.description && <p className="text-sm text-gray-500 leading-relaxed flex-1">{clinic.description}</p>}
          <div className="flex items-center gap-2.5 mt-auto">
            <a href={`/clinics/${citySlug(clinic.city)}/${clinic.slug}`} className="inline-block bg-sage text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-onyx transition-colors">View Full Profile</a>
            {clinic.bookingUrl
              ? <a href={clinic.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-sage bg-sage/[0.08] border border-sage/20 px-4 py-2.5 rounded hover:bg-sage/[0.15] transition-colors">Reserve Consultation</a>
              : <button className="text-sm font-semibold text-sage bg-sage/[0.08] border border-sage/20 px-4 py-2.5 rounded hover:bg-sage/[0.15] transition-colors">Reserve Consultation</button>
            }
            <ViewOnMapButton clinic={clinic} className="w-9 h-9 border border-stone/20 rounded hover:border-sage/40 hover:bg-sage/5" />
            {clinic.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-400 hover:text-sage transition-colors ml-auto" title="Visit website">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
            )}
            {clinic.priceTier && <span className={`text-sm text-gray-500 ${!clinic.website ? 'ml-auto' : ''}`}><strong className="text-onyx">{clinic.priceTier}</strong></span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClinicCard({ clinic, distanceMi }: ClinicCardProps) {
  const [saved, setSaved] = useState(false)
  return (
    <div className={`bg-white rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-[3px] ${
      clinic.featured
        ? 'border border-champagne/35 shadow-featured hover:shadow-featured-hover'
        : 'border border-gray-200 shadow-sm hover:shadow-lg hover:border-sage/25'
    }`}>
      <div className="h-[168px] relative overflow-hidden bg-gradient-to-br from-[#c9d8e8] to-[#e0eff7]">
        {clinic.imageUrl || clinic.images?.[0]
          ? <img src={clinic.imageUrl || clinic.images?.[0]} alt={clinic.name} className="w-full h-full object-cover" />
          : clinic.logo
            ? <img src={clinic.logo} alt={clinic.name} className="w-full h-full object-contain p-8" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">🏥</div>
        }
        {clinic.verified && <VerifiedBadge className="absolute top-2.5 left-2.5" />}
        {clinic.featured && <span className="absolute top-2.5 right-2.5 bg-champagne text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">⭐ Featured</span>}
        {clinic.isNew && !clinic.featured && <span className="absolute top-2.5 right-2.5 bg-onyx text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">New</span>}
        {!clinic.verified && !clinic.featured && !clinic.isNew && (
          <span className="absolute top-2.5 right-2.5 bg-white/90 border border-gray-200 text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded-full">Unclaimed</span>
        )}
        <button onClick={() => setSaved(!saved)} className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-colors ${saved ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <div className="text-[15px] font-bold text-onyx tracking-tight leading-snug">
          <a href={`/clinics/${citySlug(clinic.city)}/${clinic.slug}`} className="hover:text-sage transition-colors">{clinic.name}</a>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StarRating rating={clinic.googleRating} />
          <span className="text-sm font-bold text-onyx">{clinic.googleRating}</span>
          <span className="text-xs text-gray-400">({clinic.googleReviewCount})</span>
          {distanceMi != null && (
            <span className="text-xs text-stone font-medium bg-stone/10 px-2 py-0.5 rounded-full">
              {distanceMi.toFixed(1)} mi
            </span>
          )}
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
        {/* Vibe tags + booking availability dot + creator badge */}
        {(() => {
          const vibeTags = getCardVibeTags(clinic)
          const hasBooking = !!clinic.bookingUrl
          const isCreator = detectInfluencer(clinic)
          const tier = isCreator ? getInfluencerTier(clinic) : null
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {vibeTags.map(tag => (
                <span
                  key={tag}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${VIBE_STYLES[tag as VibeTag] ?? 'bg-gray-100 border-gray-200 text-gray-500'}`}
                >
                  {tag}
                </span>
              ))}
              {isCreator && tier && <CreatorBadge tier={tier} variant="card" />}
              <span className={`flex items-center gap-1 text-[10px] font-medium ${hasBooking ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasBooking ? 'bg-green-500' : 'bg-gray-300'}`} />
                {hasBooking ? 'Online Booking' : 'Contact Only'}
              </span>
            </div>
          )
        })()}
        {clinic.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{clinic.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
        <a href={`/clinics/${citySlug(clinic.city)}/${clinic.slug}`} className="flex-1 text-center text-sm font-semibold text-white bg-sage px-3.5 py-2 rounded hover:bg-onyx transition-colors">View Profile</a>
        {clinic.bookingUrl
          ? <a href={clinic.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-sage bg-sage/[0.08] border border-sage/20 px-3.5 py-2 rounded hover:bg-sage/[0.15] transition-colors">Reserve</a>
          : <button className="text-sm font-semibold text-sage bg-sage/[0.08] border border-sage/20 px-3.5 py-2 rounded hover:bg-sage/[0.15] transition-colors">Reserve</button>
        }
        <ViewOnMapButton clinic={clinic} className="w-8 h-8 border border-stone/20 rounded hover:border-sage/40 hover:bg-sage/5" />
        {clinic.website && (
          <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-sage transition-colors" title="Visit website">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </a>
        )}
        {clinic.priceTier && <span className="text-xs text-gray-500 ml-auto"><strong className="text-onyx font-semibold">{clinic.priceTier}</strong></span>}
      </div>
    </div>
  )
}
