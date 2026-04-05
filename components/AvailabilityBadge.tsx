'use client'
import { useEffect, useState } from 'react'
import { fetchAvailability, formatSlot } from '@/lib/availability'

interface Props {
  icalUrl?: string
  bookingUrl?: string
}

export default function AvailabilityBadge({ icalUrl, bookingUrl }: Props) {
  const [nextSlot, setNextSlot] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!icalUrl) return
    setLoading(true)
    fetchAvailability(icalUrl)
      .then(res => {
        setNextSlot(res.nextSlot)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [icalUrl])

  if (icalUrl) {
    if (loading) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-stone bg-stone/10 border border-stone/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-stone/40 animate-pulse" />
          Checking availability…
        </div>
      )
    }
    if (error) {
      return (
        <a
          href={bookingUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sage bg-sage/10 border border-sage/30 px-3 py-1.5 rounded-full hover:bg-sage/15 transition-colors"
        >
          🟢 Online Booking
        </a>
      )
    }
    if (nextSlot) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-onyx bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
          <span className="text-blue-500">📅</span>
          <span className="font-medium">Next:</span>
          <span className="font-semibold">{formatSlot(nextSlot)}</span>
        </div>
      )
    }
    // iCal present but no slots
    return (
      <a
        href={bookingUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-sage bg-sage/10 border border-sage/30 px-3 py-1.5 rounded-full hover:bg-sage/15 transition-colors"
      >
        🟢 Book Now
      </a>
    )
  }

  // No iCal, but has bookingUrl
  if (bookingUrl) {
    return (
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-sage bg-sage/10 border border-sage/30 px-3 py-1.5 rounded-full hover:bg-sage/15 transition-colors"
      >
        🟢 Online Booking Available
      </a>
    )
  }

  // No availability data
  return null
}