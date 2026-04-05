import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { INSIGHTS } from '@/data/insights'

export const metadata: Metadata = {
  title: 'GlowRoute Intelligence | Market Data & Research',
  description: 'Market data, research briefs, and industry analysis on the aesthetics and wellness industry from GlowRoute.',
  alternates: {
    canonical: 'https://glowroute.io/insights',
  },
  openGraph: {
    title: 'GlowRoute Intelligence | Market Data & Research',
    description: 'Market data, research briefs, and industry analysis on the aesthetics and wellness industry.',
    type: 'website',
    siteName: 'GlowRoute',
  },
}

const TYPE_LABELS: Record<string, string> = {
  'market-report': 'Market Report',
  'case-study': 'Case Study',
  'research-brief': 'Research Brief',
  'industry-analysis': 'Industry Analysis',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function InsightsPage() {
  const featured = INSIGHTS.filter(i => i.featured)
  const rest = INSIGHTS.filter(i => !i.featured)

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* Hero — dark intelligence aesthetic */}
      <section className="bg-onyx py-24 px-6 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-champagne/10 border border-champagne/20 text-champagne text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            ✦ Intelligence Layer
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-light text-ivory leading-tight tracking-tight mb-5">
            GlowRoute Intelligence
          </h1>
          <p className="text-base text-stone max-w-lg mx-auto leading-relaxed">
            Market data, research briefs, and industry analysis — the signal beneath the noise.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">

        {/* Featured Insights */}
        {featured.length > 0 && (
          <section className="mb-14">
            <h2 className="font-serif text-2xl text-onyx mb-8 tracking-tight">Latest Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map(insight => (
                <Link
                  key={insight.slug}
                  href={`/insights/${insight.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone/15 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {/* Image */}
                  <div className="w-full aspect-[16/9] overflow-hidden bg-stone/10 relative">
                    <img
                      src={insight.imageUrl}
                      alt={insight.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Type badge overlay */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-onyx/90 text-champagne text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded">
                        {TYPE_LABELS[insight.type] || insight.type}
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-serif text-2xl text-onyx leading-snug mb-2 group-hover:text-sage transition-colors">
                      {insight.title}
                    </h3>
                    <p className="text-stone/80 text-sm leading-relaxed mb-1 font-medium">
                      {insight.subtitle}
                    </p>
                    <p className="text-stone text-sm leading-relaxed mb-4 flex-1 mt-2">
                      {insight.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone/10">
                      <div className="flex items-center gap-3 text-stone text-xs">
                        <span>{insight.readTime}</span>
                        <span>·</span>
                        <span>{formatDate(insight.publishedAt)}</span>
                      </div>
                      <span className="text-sage text-sm font-semibold group-hover:translate-x-1 transition-transform">
                        Read Report →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Other Insights */}
        {rest.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl text-onyx mb-8 tracking-tight">More Intelligence</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(insight => (
                <Link
                  key={insight.slug}
                  href={`/insights/${insight.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone/15 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-full aspect-[16/9] overflow-hidden bg-stone/10 relative">
                    <img
                      src={insight.imageUrl}
                      alt={insight.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-onyx/90 text-champagne text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                        {TYPE_LABELS[insight.type] || insight.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-serif text-xl text-onyx leading-snug mb-2 group-hover:text-sage transition-colors">
                      {insight.title}
                    </h3>
                    <p className="text-stone text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
                      {insight.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-stone text-xs">
                        <span>{insight.readTime}</span>
                        <span>·</span>
                        <span>{formatDate(insight.publishedAt)}</span>
                      </div>
                      <span className="text-sage text-xs font-semibold group-hover:translate-x-1 transition-transform">
                        Read →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {INSIGHTS.length === 0 && (
          <div className="text-center py-20 text-stone">
            <p className="font-serif text-2xl text-onyx/40 mb-2">Intelligence reports coming soon</p>
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}
