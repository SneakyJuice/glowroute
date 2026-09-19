import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { SITE_URL } from '@/lib/config'
import { CLAIM_HUB_METADATA } from '@/lib/seo-page-overrides'
import ClaimHubForm from './ClaimHubForm'

const claimUrl = `${SITE_URL}${CLAIM_HUB_METADATA.canonicalPath}`

export const metadata: Metadata = {
  title: CLAIM_HUB_METADATA.title,
  description: CLAIM_HUB_METADATA.description,
  keywords: [...CLAIM_HUB_METADATA.keywords],
  alternates: { canonical: claimUrl },
  openGraph: {
    title: CLAIM_HUB_METADATA.title,
    description: CLAIM_HUB_METADATA.description,
    url: claimUrl,
    type: 'website',
    siteName: 'GlowRoute',
  },
  twitter: {
    card: 'summary_large_image',
    title: CLAIM_HUB_METADATA.title,
    description: CLAIM_HUB_METADATA.description,
  },
}

export default function ClaimPage({
  searchParams,
}: {
  searchParams: { clinic?: string; slug?: string }
}) {
  const prefilledClinic = searchParams.clinic || ''
  const prefilledSlug = searchParams.slug || ''

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />
      <main>
        <section className="bg-onyx text-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55 mb-4">
              For clinic owners
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-4">
              Claim Your GlowRoute Listing
            </h1>
            <p className="text-white/75 text-base leading-relaxed mb-8 max-w-2xl">
              Claiming lets you take control of your medspa or aesthetic clinic profile on GlowRoute.
              Update your listing, manage patient inquiries, and reach people searching for care near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#start-claim"
                className="inline-flex justify-center items-center bg-sage text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-sage/80 transition-colors"
              >
                Start your claim
              </a>
              <Link
                href="/clinics"
                className="inline-flex justify-center items-center border border-white/20 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:border-white/50 transition-colors"
              >
                Find your listing
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 border-b border-onyx/8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl font-semibold text-onyx mb-3">
              What claiming does
            </h2>
            <p className="text-stone text-sm leading-relaxed mb-6">
              Unclaimed profiles can still appear when patients browse GlowRoute. Claiming unlocks the
              tools to keep that listing accurate and useful for your practice.
            </p>
            <ul className="space-y-3 text-sm text-onyx/80 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                Update your profile, photos, hours, services, and contact details.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                Receive and respond to patient inquiries from your listing.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                Reach patients already searching for aesthetic care near you.
              </li>
            </ul>
            <p className="text-stone text-sm leading-relaxed mt-6">
              Already listed? Search the directory, open your clinic page, and start the claim from there.
              New to GlowRoute? Use the form below to begin.
            </p>
            <div className="mt-5">
              <Link href="/clinics" className="text-sm font-semibold text-sage hover:underline">
                Search the clinic directory →
              </Link>
            </div>
          </div>
        </section>

        <ClaimHubForm prefilledClinic={prefilledClinic} prefilledSlug={prefilledSlug} />
      </main>
      <Footer />
    </div>
  )
}
