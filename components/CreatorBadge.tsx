import type { InfluencerTier } from '@/lib/influencer'

interface Props {
  tier: InfluencerTier
  instagramUrl?: string
  /** 'card' = small inline pill; 'profile' = larger with tooltip breakdown */
  variant?: 'card' | 'profile'
}

const TIER_COLORS: Record<InfluencerTier, string> = {
  Micro: 'bg-teal-50 border-teal-200 text-teal-700',
  Mid:   'bg-cyan-50 border-cyan-200 text-cyan-700',
  Macro: 'bg-violet-50 border-violet-200 text-violet-700',
}

export default function CreatorBadge({ tier, instagramUrl, variant = 'card' }: Props) {
  if (variant === 'card') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_COLORS[tier]}`}
        title="This provider has an active social following"
      >
        ✨ Creator Clinic
      </span>
    )
  }

  // Profile variant — more prominent, with optional social link
  return (
    <div className={`inline-flex flex-col gap-0.5 px-3 py-2 rounded-xl border ${TIER_COLORS[tier]}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold">✨ Creator Clinic</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/60`}>
          {tier}
        </span>
      </div>
      <p className="text-[11px] opacity-75">This provider has an active social following</p>
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold underline underline-offset-2 mt-0.5"
        >
          View on Instagram →
        </a>
      )}
    </div>
  )
}
