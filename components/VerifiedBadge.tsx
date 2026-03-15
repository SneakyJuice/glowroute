export default function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-teal-light/40 text-teal text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${className}`}>
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      GlowRoute Verified
    </span>
  )
}
