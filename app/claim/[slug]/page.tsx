import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { allClinics } from '@/data/all-clinics'
import { PLANS } from '@/lib/stripe'
import ClaimCheckoutButton from './ClaimCheckoutButton'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const clinic = allClinics.find(c => c.slug === params.slug)
  if (!clinic) return { title: 'Claim Your Listing — GlowRoute' }
  return {
    title: `Claim ${clinic.name} — GlowRoute`,
    description: `Take control of your GlowRoute listing for ${clinic.name} in ${clinic.city}, FL. Manage your profile and attract more patients.`,
  }
}

export async function generateStaticParams() {
  // Pre-render first 200 slugs; the rest are on-demand
  return allClinics.slice(0, 200).map(c => ({ slug: c.slug }))
}

const PLAN_ORDER = ['starter', 'growth', 'pro'] as const

export default function ClaimSlugPage({ params }: Props) {
  const clinic = allClinics.find(c => c.slug === params.slug)
  if (!clinic) notFound()

  const displayCity = `${clinic.city}, FL`
  const rating = clinic.googleRating ?? 0
  const reviewCount = clinic.googleReviewCount ?? 0

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* ── Hero / Clinic snapshot ─────────────────────────────────────── */}
      <section className="bg-onyx text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Unclaimed badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/70 rounded-full text-[11px] font-semibold uppercase tracking-widest px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Unclaimed Listing
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Clinic image */}
            <div className="w-full sm:w-[120px] h-[120px] rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
              {clinic.imageUrl
                ? <img src={clinic.imageUrl} alt={clinic.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-4xl">🏥</div>
              }
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight mb-1">
                {clinic.name}
              </h1>
              <p className="text-white/60 text-sm mb-3">
                {clinic.address ?? displayCity}
              </p>
              {rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`text-[13px] ${i <= Math.round(rating) ? 'text-champagne' : 'text-white/20'}`}>★</span>
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                  <span className="text-white/50 text-xs">({reviewCount.toLocaleString()} reviews)</span>
                </div>
              )}
              {/* Services */}
              {(clinic.treatments?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {[...(clinic.treatments ?? []), ...(clinic.specialtyTreatments ?? [])].slice(0, 6).map(t => (
                    <span key={t} className="text-[11px] font-medium bg-white/10 border border-white/15 text-white/80 px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sales hook ────────────────────────────────────────────────────── */}
      <section className="bg-sage/10 border-b border-sage/20 py-5 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-onyx leading-relaxed">
              <strong className="text-sage">Your listing is live.</strong>{' '}
              430+ high-intent patients searched for medspas in your area last month.
              Claim it before a competitor does.
            </p>
          </div>
          <a
            href="mailto:hello@glowroute.io"
            className="text-sm font-semibold text-sage hover:underline whitespace-nowrap flex-shrink-0"
          >
            Contact Us First →
          </a>
        </div>
      </section>

      {/* ── Pricing tiers ─────────────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-onyx text-center mb-2">
            Choose Your Plan
          </h2>
          <p className="text-stone text-sm text-center mb-8">
            Cancel anytime. 30-day money-back guarantee.
          </p>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {PLAN_ORDER.map(key => {
              const plan = PLANS[key]
              return (
                <div
                  key={key}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    'highlight' in plan && plan.highlight
                      ? 'border-sage bg-sage/5 shadow-md'
                      : 'border-onyx/10 bg-white'
                  }`}
                >
                  {'highlight' in plan && plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-sage text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone mb-1">{plan.name}</p>
                    <p className="text-3xl font-bold text-onyx">{plan.monthlyLabel}</p>
                    <p className="text-xs text-stone mt-1">{plan.tagline}</p>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-stone">
                        <svg className="w-3.5 h-3.5 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <ClaimCheckoutButton
                    tier={key}
                    clinicSlug={clinic.slug}
                    clinicName={clinic.name}
                    highlight={'highlight' in plan ? !!plan.highlight : false}
                  />
                </div>
              )
            })}
          </div>

          {/* Feature comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-onyx/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-onyx/10">
                  <th className="text-left text-xs font-bold text-stone uppercase tracking-widest p-4 w-1/2">Feature</th>
                  {PLAN_ORDER.map(key => (
                    <th key={key} className={`text-center text-xs font-bold uppercase tracking-widest p-4 ${
                      'highlight' in PLANS[key] && (PLANS[key] as typeof PLANS.growth).highlight ? 'text-sage' : 'text-stone'
                    }`}>
                      {PLANS[key].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-onyx/5">
                {FEATURE_ROWS.map(row => (
                  <tr key={row.label} className="hover:bg-ivory/60 transition-colors">
                    <td className="p-4 text-onyx/80">{row.label}</td>
                    {PLAN_ORDER.map(key => (
                      <td key={key} className="p-4 text-center">
                        {row[key] === true  && <Check />}
                        {row[key] === false && <Dash />}
                        {typeof row[key] === 'string' && (
                          <span className="text-xs font-medium text-onyx/70">{row[key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Secondary CTA */}
          <div className="mt-8 text-center">
            <p className="text-stone text-sm mb-3">Not ready to commit? We&apos;ll answer your questions.</p>
            <a
              href="mailto:hello@glowroute.io"
              className="inline-flex items-center gap-2 text-sm font-semibold text-onyx border border-onyx/15 hover:border-sage hover:text-sage px-5 py-2.5 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              Contact Us First
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust footer ─────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-onyx/8 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6">
          {[
            { icon: '🔒', text: 'Secure checkout via Stripe' },
            { icon: '↩️', text: '30-day money-back guarantee' },
            { icon: '🚫', text: 'Cancel anytime' },
            { icon: '⚡', text: 'Live within 1 business day' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-stone">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────
function Check() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sage/10 mx-auto">
      <svg className="w-3 h-3 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
  )
}

function Dash() {
  return <span className="text-onyx/20 text-lg leading-none">–</span>
}

// ── Feature comparison rows ───────────────────────────────────────────────────
const FEATURE_ROWS: Array<{ label: string; starter: boolean | string; growth: boolean | string; pro: boolean | string }> = [
  { label: 'Claim & verify listing',           starter: true,         growth: true,          pro: true         },
  { label: 'Edit photos, hours & services',    starter: true,         growth: true,          pro: true         },
  { label: 'Receive patient leads via email',  starter: true,         growth: true,          pro: true         },
  { label: 'Remove competitor ads',            starter: true,         growth: true,          pro: true         },
  { label: 'Featured placement in search',     starter: false,        growth: true,          pro: true         },
  { label: 'Priority ranking',                 starter: false,        growth: true,          pro: true         },
  { label: 'Analytics dashboard',              starter: false,        growth: true,          pro: true         },
  { label: 'GlowRoute Verified badge',         starter: false,        growth: false,         pro: true         },
  { label: 'Homepage spotlight',               starter: false,        growth: false,         pro: true         },
  { label: 'Competitor conquest ads',          starter: false,        growth: false,         pro: true         },
  { label: 'Dedicated account manager',        starter: false,        growth: false,         pro: true         },
  { label: 'Monthly fee',                      starter: '$99/mo',     growth: '$249/mo',     pro: '$499/mo'    },
]
