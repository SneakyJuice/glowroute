import Link from 'next/link'
import { COST_GUIDES } from '@/lib/cost-guides'

export const metadata = {
  title: 'Medspa Treatment Cost Guides — GlowRoute',
  description: 'How much does Botox, semaglutide, HydraFacial, laser hair removal, and more cost? Real pricing data from verified medspa providers.',
}

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      <section className="pt-16 pb-10 px-6 max-w-3xl mx-auto text-center">
        <div className="text-xs tracking-[3px] uppercase text-[#028090] mb-4">Treatment Guides</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          What Does It <span className="text-[#c9a96e]">Actually</span> Cost?
        </h1>
        <p className="text-[#888] text-base leading-relaxed">
          Real pricing data from verified medspa providers. Know what to expect before you book.
        </p>
      </section>

      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <div className="grid gap-4">
          {COST_GUIDES.map(guide => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="flex items-center justify-between bg-[#111] border border-white/10 rounded-xl px-6 py-5 hover:border-[#028090]/50 transition-colors group"
            >
              <div>
                <div className="font-semibold text-white group-hover:text-[#c9a96e] transition-colors">
                  How much does {guide.treatment} cost?
                </div>
                <div className="text-sm text-[#555] mt-1">Avg: {guide.avgMid}</div>
              </div>
              <span className="text-[#028090] text-lg">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
