'use client'
import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { label: 'Explore Providers', href: '/clinics' },
    { label: 'Treatments', href: '/treatments' },
    { label: 'Cost Guides', href: '/guides' },
    { label: 'Near Me', href: '/clinics?near=me' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-onyx border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto flex items-center gap-8 px-6 h-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-serif text-[22px] font-normal text-white tracking-tight flex-shrink-0">
          <span className="text-champagne text-lg leading-none">✦</span>
          Glow<span className="text-champagne">Route</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-white/70 px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.08] transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2.5 ml-auto">
          <a href="#" className="text-sm font-medium text-white/80 px-3.5 py-1.5 rounded hover:text-white hover:bg-white/10 transition-colors">Sign In</a>
          <a href="/claim" className="text-sm font-semibold text-white bg-sage px-4 py-1.5 rounded hover:opacity-90 transition-opacity">Join the Network</a>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-3 ml-auto">
          <a href="/claim" className="text-xs font-semibold text-white bg-sage px-3 py-1.5 rounded">Join</a>
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
            className="flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          >
            <span className={`block w-5 h-0.5 bg-white transition-transform origin-center ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform origin-center ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-onyx px-6 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-white/80 py-2.5 border-b border-white/[0.06] last:border-0 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a href="/claim" onClick={() => setMobileOpen(false)} className="mt-3 text-sm font-semibold text-white bg-sage text-center py-2.5 rounded">
            Join the Network →
          </a>
        </div>
      )}
    </nav>
  )
}
