export default function BottomCTA() {
  return (
    <div className="relative bg-navy rounded-2xl px-8 py-10 text-center mt-12 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(2,192,154,0.12),transparent)] pointer-events-none" />
      <h2 className="font-serif text-[26px] font-bold text-white mb-2.5 relative">Own a medspa or aesthetic clinic?</h2>
      <p className="text-[15px] text-white/65 mb-6 relative">Join 277+ verified Florida clinics already on GlowRoute. Claim your free listing in minutes.</p>
      <div className="flex gap-3 justify-center flex-wrap relative">
        <a href="/claim" className="text-sm font-bold text-navy bg-teal-light px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">Claim Your Free Listing</a>
        <a href="/pricing" className="text-sm font-semibold text-white border border-white/30 px-6 py-3 rounded-xl hover:bg-white/10 hover:border-white/60 transition-all">Learn About Pro Plans →</a>
      </div>
    </div>
  )
}
