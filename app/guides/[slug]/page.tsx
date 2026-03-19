import { notFound } from 'next/navigation'
import Link from 'next/link'
import { COST_GUIDES, getGuideBySlug } from '@/lib/cost-guides'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return COST_GUIDES.map(g => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug)
  if (!guide) return {}
  return {
    title: `How Much Does ${guide.treatment} Cost? (2025 Guide) — GlowRoute`,
    description: `${guide.treatment} pricing guide: low end ${guide.avgLow}, average ${guide.avgMid}. What affects cost and what to look for in a provider.`,
    keywords: `${guide.treatment} cost, ${guide.treatment} price, how much does ${guide.treatment} cost, medspa pricing`,
  }
}

export default function CostGuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuideBySlug(params.slug)
  if (!guide) notFound()

  const priceRows = [
    { label: 'Budget', value: guide.avgLow, color: 'text-[#7a9e7e]' },
    { label: 'Average', value: guide.avgMid, color: 'text-[#c9a96e]' },
    { label: 'Premium', value: guide.avgHigh, color: 'text-[#e8d5b0]' },
    { label: 'Luxury', value: guide.avgPremium, color: 'text-white' },
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">

        {/* Breadcrumb */}
        <div className="px-6 pt-8 max-w-3xl mx-auto">
          <div className="text-xs text-[#555] flex gap-2 items-center">
            <Link href="/" className="hover:text-[#888]">Home</Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-[#888]">Treatment Guides</Link>
            <span>/</span>
            <span className="text-[#888]">{guide.treatment} Cost</span>
          </div>
        </div>

        {/* Hero */}
        <section className="px-6 pt-8 pb-10 max-w-3xl mx-auto">
          <div className="text-xs tracking-[3px] uppercase text-[#028090] mb-4">Cost Guide · 2025</div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4">
            How Much Does{' '}
            <span className="text-[#c9a96e]">{guide.treatment}</span> Cost?
          </h1>
          <p className="text-[#888] text-base leading-relaxed">{guide.intro}</p>
        </section>

        {/* Price Table */}
        <section className="px-6 pb-10 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold mb-5">Price ranges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {priceRows.map(row => (
              <div key={row.label} className="bg-[#111] border border-white/10 rounded-xl p-5">
                <div className="text-xs uppercase tracking-[2px] text-[#555] mb-2">{row.label}</div>
                <div className={`text-sm font-semibold leading-snug ${row.color}`}>{row.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why prices vary */}
        <section className="px-6 pb-10 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold mb-5">Why prices vary</h2>
          <ul className="space-y-4">
            {guide.whyVary.map((point, i) => (
              <li key={i} className="flex gap-4 text-sm text-[#aaa] leading-relaxed">
                <span className="text-[#028090] font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* What to look for */}
        <section className="px-6 pb-10 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold mb-5">What to look for in a provider</h2>
          <ul className="space-y-4">
            {guide.whatToLookFor.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-[#aaa] leading-relaxed">
                <span className="text-[#c9a96e] mt-1 flex-shrink-0">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="px-6 pb-10 max-w-3xl mx-auto">
          <div className="bg-[#111] border border-[#028090]/30 rounded-2xl p-8 text-center">
            <div className="text-lg font-bold mb-2">Find {guide.treatment} providers near you</div>
            <p className="text-sm text-[#888] mb-6">Browse verified clinics, compare GlowScore™ ratings, and book directly.</p>
            <Link
              href={`/treatments/${guide.relatedTreatmentSlug}`}
              className="inline-block bg-[#028090] hover:bg-[#03a0b3] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Browse {guide.treatment} Clinics →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 pb-20 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold mb-6">Common questions</h2>
          <div className="space-y-6">
            {guide.faq.map((item, i) => (
              <div key={i} className="border-b border-white/10 pb-6">
                <h3 className="font-semibold text-white mb-2 text-sm">{item.q}</h3>
                <p className="text-sm text-[#888] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  )
}
