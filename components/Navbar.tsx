'use client'
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto flex items-center gap-8 px-6 h-16">
        <a href="/" className="flex items-center gap-2 font-serif text-[22px] font-bold text-white tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-base">✨</div>
          Glow<span className="text-teal-light">Route</span>
        </a>
        <div className="hidden md:flex items-center gap-1 flex-1">
          {['Find a Clinic', 'Treatments', 'Articles', 'Near Me'].map((link) => (
            <a key={link} href="#" className="text-sm font-medium text-white/70 px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.08] transition-colors">
              {link}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2.5 ml-auto">
          <a href="#" className="hidden md:block text-sm font-medium text-white/80 px-3.5 py-1.5 rounded hover:text-white hover:bg-white/10 transition-colors">Sign In</a>
          <a href="#" className="text-sm font-semibold text-navy bg-teal-light px-4 py-1.5 rounded hover:opacity-90 transition-opacity">List Your Clinic</a>
        </div>
      </div>
    </nav>
  )
}
