'use client'
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-onyx border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto flex items-center gap-8 px-6 h-16">
        <a href="/" className="flex items-center gap-2 font-serif text-[22px] font-normal text-white tracking-tight">
          <span className="text-champagne text-lg leading-none">✦</span>
          Glow<span className="text-champagne">Route</span>
        </a>
        <div className="hidden md:flex items-center gap-1 flex-1">
          {[
            { label: 'Explore Providers', href: '/clinics' },
            { label: 'Treatments', href: '/treatments' },
            { label: 'Cost Guides', href: '/guides' },
            { label: 'Near Me', href: '/clinics' },
          ].map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-white/70 px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.08] transition-colors">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2.5 ml-auto">
          <a href="#" className="hidden md:block text-sm font-medium text-white/80 px-3.5 py-1.5 rounded hover:text-white hover:bg-white/10 transition-colors">Sign In</a>
          <a href="/claim" className="text-sm font-semibold text-white bg-sage px-4 py-1.5 rounded hover:opacity-90 transition-opacity">Join the Network</a>
        </div>
      </div>
    </nav>
  )
}
