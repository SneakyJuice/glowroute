import Link from 'next/link'
import { PLANS } from '@/lib/stripe'
import { CheckIcon } from '@heroicons/react/24/solid'

export const metadata = {
  title: 'Pricing — GlowRoute',
  description: 'Choose the right plan to grow your medspa. Starter $99/mo, Growth $249/mo, Pro $499/mo. No contracts, cancel anytime.',
}

const faqs = [
  {
    q: 'How does claiming work?',
    a: "Select a plan, complete checkout, and you'll receive an email to verify your clinic. Once verified, you can edit your profile, upload photos, and start receiving leads.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fees. Cancel from your dashboard and your listing reverts to a free unclaimed profile.',
  },
  {
    q: 'What is GlowScore™?',
    a: 'GlowScore™ is our proprietary 0–100 ranking algorithm. It factors in your rating, review volume, profile completeness, booking availability, and specialty signals. Higher scores mean better placement.',
  },
  {
    q: 'How long until I see results?',
    a: "Most clinics see their first inbound lead within 48 hours of claiming. SEO benefits compound over 30–90 days as Google indexes your enhanced profile.",
  },
]

export default function PricingPage() {
  type PlanEntry = { key: string; name: string; monthlyLabel: string; tagline: string; features: readonly string[]; highlight?: boolean }
  const plans: PlanEntry[] = [
    { key: 'starter', ...PLANS.starter },
    { key: 'growth', ...PLANS.growth },
    { key: 'pro', ...PLANS.pro },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">

      {/* ── Hero ── */}
      <section className="pt-20 pb-12 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-block text-xs tracking-[3px] uppercase text-[#028090] mb-5">
          Clinic Owner Plans
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          Turn Your Listing Into a{' '}
          <span className="text-[#c9a96e]">Lead Machine</span>
        </h1>
        <p className="text-[#888] text-lg leading-relaxed mb-3">
          3,500+ patients searched for medspa providers in your area last month.
          Claim your listing and make sure they find you first.
        </p>
        <p className="text-sm text-[#555]">✦ No contract · Cancel anytime · First 5 leads free</p>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'border-[#c9a96e] bg-[#1a1a1a]'
                  : 'border-white/10 bg-[#111]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a96e] text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className="text-xs tracking-[2px] uppercase text-[#888] mb-2">{plan.name}</div>
                <div className="text-4xl font-black text-white mb-1">{plan.monthlyLabel}</div>
                <div className="text-sm text-[#888]">{plan.tagline}</div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#ccc]">
                    <CheckIcon className="w-4 h-4 text-[#028090] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/api/checkout?tier=${plan.key}`}
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-[#c9a96e] text-black hover:bg-[#e8d5b0]'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                Get {plan.name} →
              </Link>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center text-sm text-[#666] border border-white/5 rounded-xl p-6 bg-[#111]">
          <div><span className="text-[#c9a96e] font-semibold block text-base">3,500+</span>Clinics listed</div>
          <div><span className="text-[#c9a96e] font-semibold block text-base">4.6★</span>avg network rating</div>
          <div><span className="text-[#c9a96e] font-semibold block text-base">First 5</span>leads are free</div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 pb-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Common questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-white/10 pb-6">
              <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-[#888] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 pb-24 text-center">
        <p className="text-[#555] text-sm mb-3">Not ready to commit?</p>
        <Link href="/claim" className="text-[#028090] hover:underline text-sm">
          Claim your free listing first →
        </Link>
      </section>

    </main>
  )
}
