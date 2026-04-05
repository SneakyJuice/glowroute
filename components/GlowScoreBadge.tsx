'use client'
import { useState } from 'react'
import type { GlowScoreBreakdown, GlowTier } from '@/lib/glowscore'
import { TIER_COLORS } from '@/lib/glowscore'

interface CardBadgeProps {
  score: GlowScoreBreakdown
}

/** Small circular badge for clinic cards — bottom right corner */
export function GlowScoreCardBadge({ score }: CardBadgeProps) {
  const [show, setShow] = useState(false)
  const { bg, text, border, ring } = TIER_COLORS[score.tier]

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className={`w-9 h-9 rounded-full border-2 flex flex-col items-center justify-center ${bg} ${border}`}
        style={{ borderColor: ring }}
        aria-label={`GlowScore™ ${score.total} — ${score.tier}`}
      >
        <span className={`text-[9px] font-black leading-none ${text}`}>{score.total}</span>
        <span className={`text-[7px] font-bold leading-none ${text} opacity-70`}>✦</span>
      </button>
      {show && (
        <div className="absolute bottom-full right-0 mb-2 z-50 bg-onyx text-white text-[11px] rounded-xl shadow-lg p-3 w-44 pointer-events-none">
          <p className="font-bold text-sm mb-1">GlowScore™ {score.total}/100</p>
          <p className="opacity-70 mb-2">{score.tier} tier</p>
          {[
            { label: 'Rating', pts: score.rating, max: 30 },
            { label: 'Reviews', pts: score.reviewVolume, max: 20 },
            { label: 'Profile', pts: score.profileComplete, max: 20 },
            { label: 'Booking', pts: score.bookingActive, max: 15 },
            { label: 'Peptide', pts: score.peptideSignal, max: 10 },
            { label: 'Creator', pts: score.creatorSignal, max: 5 },
          ].map(({ label, pts, max }) => (
            <div key={label} className="flex items-center gap-1.5 mb-1">
              <span className="w-12 opacity-60">{label}</span>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full"
                  style={{ width: `${(pts / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right opacity-80">{pts}</span>
            </div>
          ))}
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

/** Full sidebar card for clinic profile pages */
export function GlowScoreProfileCard({ score, clinicSlug, isUnclaimed }: ProfileCardProps) {
  const { bg, text, border, ring } = TIER_COLORS[score.tier]

  // SVG circle parameters
  const r = 36
  const cx = 48
  const cy = 48
  const circumference = 2 * Math.PI * r
  const pct = score.total / 100
  const dashOffset = circumference * (1 - pct)

  const TIER_LABEL: Record<GlowTier, string> = {
    Elite:    '🏆 Elite',
    Verified: '✅ Verified',
    Standard: '⭐ Standard',
    Basic:    '📋 Basic',
  }

  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-navy">GlowScore™</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${text}`}>
          {TIER_LABEL[score.tier]}
        </span>
      </div>

      {/* Circular score */}
      <div className="flex items-center gap-5 mb-4">
        <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0">
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x={cx} y={cy - 4} textAnchor="middle" className="font-black" style={{ fontSize: 22, fontWeight: 900, fill: ring }}>
            {score.total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fill: '#8C8279' }}>
            / 100
          </text>
        </svg>
        <div className="flex-1">
          <p className="text-xs text-stone leading-relaxed">
            Score reflects rating, review volume, profile completeness, and booking availability.
          </p>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        {[
          { label: 'Rating quality', pts: score.rating,         max: 30 },
          { label: 'Review volume',  pts: score.reviewVolume,   max: 20 },
          { label: 'Profile completeness', pts: score.profileComplete, max: 20 },
          { label: 'Online booking', pts: score.bookingActive,  max: 15 },
          { label: 'Peptide signals', pts: score.peptideSignal, max: 10 },
          { label: 'Creator presence', pts: score.creatorSignal, max: 5 },
        ].map(({ label, pts, max }) => (
          <div key={label}>
            <div className="flex justify-between text-[11px] text-stone mb-0.5">
              <span>{label}</span>
              <span className="font-semibold">{pts}/{max}</span>
            </div>
            <div className="h-1.5 bg-black/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(pts / max) * 100}%`, backgroundColor: ring }}
              />
            </div>
          </div>
        ))}
      </div>

      {isUnclaimed && (
        <div className="mt-4 pt-4 border-t border-black/8">
          <p className="text-xs text-stone mb-2">
            Claim your listing to improve your GlowScore™
          </p>
          {clinicSlug && (
            <a
              href={`/claim/${clinicSlug}`}
              className={`block text-center text-xs font-bold py-2 rounded-xl bg-white/60 border ${border} ${text} hover:bg-white transition-colors`}
            >
              Improve Your Score →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
