export default function BottomCTA() {
  return (
    <div className="relative bg-onyx rounded-2xl px-8 py-10 text-center mt-12 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(201,169,110,0.08),transparent)] pointer-events-none" />
      <h2 className="font-serif text-[26px] font-light text-white mb-2.5 relative">Elevate your practice. Reach your ideal clients.</h2>
      <p className="text-[15px] text-white/65 mb-6 relative">Join 292+ verified providers already on GlowRoute. It takes minutes.</p>
      <div className="flex gap-3 justify-center flex-wrap relative">
        <a href="/claim" className="text-sm font-bold text-white bg-sage px-6 py-3 rounded hover:opacity-90 transition-opacity">Join the GlowRoute Network</a>
        <a href="/pricing" className="text-sm font-semibold text-white border border-white/30 px-6 py-3 rounded hover:bg-white/10 hover:border-white/60 transition-all">Learn About Pro Plans →</a>
      </div>
    </div>
  )
}
