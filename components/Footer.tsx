export default function Footer() {
  return (
    <footer className="bg-onyx text-white/50 px-6 py-8 mt-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="font-serif text-base font-bold text-white">Glow<span className="text-sage/80">Route</span></div>
        <div className="flex gap-5">
          {['About', 'For Clinics', 'Advertise', 'Privacy', 'Terms'].map(l => <a key={l} href="#" className="text-xs hover:text-white transition-colors">{l}</a>)}
        </div>
        <div className="text-[11px]">© 2025 GlowRoute. Not medical advice.</div>
      </div>
    </footer>
  )
}
