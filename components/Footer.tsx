export default function Footer() {
  return (
    <footer className="bg-onyx text-white/50 px-6 py-10 mt-0 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="font-serif text-base font-bold text-white">Glow<span className="text-sage/80">Route</span></div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="/clinics" className="text-xs hover:text-white transition-colors">Find Clinics</a>
          <a href="/treatments" className="text-xs hover:text-white transition-colors">Treatments</a>
          <a href="/guides" className="text-xs hover:text-white transition-colors">Cost Guides</a>
          <a href="/articles" className="text-xs hover:text-white transition-colors">Articles</a>
          <a href="/claim" className="text-xs hover:text-white transition-colors">For Clinics</a>
          <a href="/pricing" className="text-xs hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <div className="text-[11px]">© 2026 GlowRoute. Not medical advice.</div>
          <div className="flex gap-4">
            {['Privacy', 'Terms'].map(l => <a key={l} href="#" className="text-[11px] hover:text-white transition-colors">{l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  )
}
