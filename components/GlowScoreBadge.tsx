'use client'

import { useId, useState } from 'react'
import type { GlowScoreBreakdown, GlowTier } from '@/lib/glowscore'
import { TIER_COLORS } from '@/lib/glowscore'

// A score tier describes the available profile data, not credential verification.
const TIER_LABELS: Record<GlowTier, string> = {
  Elite: 'Elite',
  Verified: 'Established',
  Standard: 'Standard',
  Basic: 'Basic',
}

function scoreBuckets(score: GlowScoreBreakdown) {
  return [
    { label: 'Reputation', pts: score.ratingQuality + score.reviewVolume, max: 40 },
    { label: 'Service coverage', pts: score.serviceDepth + score.goalBreadth + score.nicheBonus, max: 35 },
    { label: 'Profile details', pts: score.description + score.heroImage + score.website, max: 15 },
    { label: 'Claim & verification', pts: score.claimed + score.verified, max: 10 },
  ]
}

export function GlowScoreCardBadge({ score }: { score: GlowScoreBreakdown }) {
  const [show, setShow] = useState(false)
  const tooltipId = useId()
  const { bg, text, border, ring } = TIER_COLORS[score.tier]

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow(true)}
        onKeyDown={event => { if (event.key === 'Escape') setShow(false) }}
        className={`w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${bg} ${border}`}
        style={{ borderColor: ring }}
        aria-label={`GlowScore ${score.total} out of 100, ${TIER_LABELS[score.tier]} score tier`}
        aria-describedby={show ? tooltipId : undefined}
      >
        <span className={`text-[11px] font-black leading-none ${text}`}>{score.total}</span>
        <span aria-hidden="true" className={`text-[8px] leading-none ${text}`}>/100</span>
      </button>
      {show && (
        <div id={tooltipId} role="tooltip" className="absolute bottom-full right-0 mb-2 z-50 bg-onyx text-white text-xs rounded-xl shadow-lg p-3 w-60 pointer-events-none">
          <p className="font-bold mb-1">GlowScore {score.total}/100</p>
          <p className="opacity-80 mb-2">{TIER_LABELS[score.tier]} score tier</p>
          {scoreBuckets(score).map(({ label, pts, max }) => (
            <div key={label} className="flex justify-between gap-3 mb-1">
              <span>{label}</span><span>{pts}/{max}</span>
            </div>
          ))}
          <p className="mt-2 opacity-80">Based on available listing data. Not a clinical quality rating.</p>
        </div>
      )}
    </div>
  )
}

interface ProfileCardProps {
  score: GlowScoreBreakdown
  clinicSlug?: string
  isUnclaimed?: boolean
}

export function GlowScoreProfileCard({ score, clinicSlug, isUnclaimed }: ProfileCardProps) {
  const { bg, text, border, ring } = TIER_COLORS[score.tier]
  const circumference = 2 * Math.PI * 36

  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-onyx">GlowScore</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${text}`}>
          {TIER_LABELS[score.tier]}
        </span>
      </div>
      <div className="flex items-center gap-5 mb-4">
        <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0" role="img" aria-label={`GlowScore ${score.total} out of 100`}>
          <circle cx="48" cy="48" r="36" fill="none" stroke="currentColor" className="text-onyx/10" strokeWidth="8" />
          <circle cx="48" cy="48" r="36" fill="none" stroke={ring} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score.total / 100)} transform="rotate(-90 48 48)" />
          <text x="48" y="44" textAnchor="middle" className="fill-onyx text-[22px] font-black">{score.total}</text>
          <text x="48" y="62" textAnchor="middle" className="fill-stone text-[10px]">/ 100</text>
        </svg>
        <p className="text-xs text-stone leading-relaxed">Based on reputation, service coverage, profile details, and claim status. Not a clinical quality rating.</p>
      </div>
      <div className="space-y-2">
        {scoreBuckets(score).map(({ label, pts, max }) => (
          <div key={label}>
            <div className="flex justify-between gap-3 text-xs text-stone mb-1">
              <span>{label}</span><span className="font-semibold">{pts}/{max}</span>
            </div>
            <div aria-hidden="true" className="h-1.5 bg-onyx/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pts / max * 100))}%`, backgroundColor: ring }} />
            </div>
          </div>
        ))}
      </div>
      {isUnclaimed && clinicSlug && (
        <div className="mt-4 pt-4 border-t border-onyx/10">
          <p className="text-xs text-stone mb-2">Own this clinic? Claim the listing to keep its details current.</p>
          <a href={`/claim/${clinicSlug}`} className={`block text-center text-xs font-bold py-2 rounded-xl bg-white/60 border ${border} ${text} hover:bg-white transition-colors`}>Claim This Listing</a>
        </div>
      )}
    </div>
  )
}
