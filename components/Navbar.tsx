'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

const LINKS = [
  { label: 'Explore Providers', href: '/clinics' },
  { label: 'Treatments', href: '/treatments' },
  { label: 'Cost Guides', href: '/guides' },
  { label: 'Articles', href: '/articles' },
  { label: 'Intelligence', href: '/insights' },
  { label: 'Find nearby', href: '/clinics#search-location' },
  { label: 'Find Your Match', href: '/quiz' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-onyx border-b border-white/[0.08]"
      onKeyDown={event => {
        if (event.key === 'Escape' && mobileOpen) {
          setMobileOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-16">
        <Link prefetch={false} href="/" aria-label="GlowRoute home" className="flex items-center gap-2 font-serif text-[22px] font-normal text-white tracking-tight flex-shrink-0">
          <span aria-hidden="true" className="text-champagne text-lg leading-none">✦</span>
          Glow<span className="text-champagne">Route</span>
        </Link>

        <div className="hidden xl:flex items-center gap-0.5 flex-1 min-w-0">
          {LINKS.map(link => (
            <Link prefetch={false} key={link.label} href={link.href} className="inline-flex items-center min-h-11 whitespace-nowrap text-sm font-medium text-white/80 px-2.5 rounded hover:text-white hover:bg-white/[0.08] transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <Link prefetch={false} href="/claim" className="hidden xl:inline-flex items-center min-h-11 flex-shrink-0 text-sm font-semibold text-white bg-sage px-4 rounded hover:opacity-90 transition-opacity">
          Join the Network
        </Link>

        <div className="flex xl:hidden items-center gap-2 ml-auto">
          <Link prefetch={false} href="/claim" className="inline-flex items-center min-h-11 text-sm font-semibold text-white bg-sage px-3 rounded">Join</Link>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMobileOpen(open => !open)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="flex flex-col justify-center items-center w-11 h-11 gap-1.5 rounded"
          >
            <span aria-hidden="true" className={`block w-5 h-0.5 bg-white transition-transform origin-center ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span aria-hidden="true" className={`block w-5 h-0.5 bg-white transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
            <span aria-hidden="true" className={`block w-5 h-0.5 bg-white transition-transform origin-center ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      <div id="mobile-navigation" hidden={!mobileOpen} className="xl:hidden border-t border-white/10 bg-onyx px-4 sm:px-6 py-4 max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <div className="flex flex-col gap-1">
          {LINKS.map(link => (
            <Link prefetch={false} key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center min-h-11 text-sm font-medium text-white/80 py-2.5 border-b border-white/[0.06] last:border-0 hover:text-white">
              {link.label}
            </Link>
          ))}
          <Link prefetch={false} href="/claim" onClick={() => setMobileOpen(false)} className="mt-3 text-sm font-semibold text-white bg-sage text-center min-h-11 px-4 py-3 rounded">
            Join the Network →
          </Link>
        </div>
      </div>
    </nav>
  )
}
