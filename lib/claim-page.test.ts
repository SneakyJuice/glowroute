import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'
import { Script } from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import * as seoOverrides from './seo-page-overrides.ts'
import type { Clinic } from '../types/clinic.ts'

const require = createRequire(import.meta.url)

// Execute the actual route without a network/Stripe dependency or a Next server.
// This tests emitted metadata and visible text rather than matching source strings.
function loadClaimPage(clinics: Record<string, Clinic> = {}) {
  const source = readFileSync(new URL('../app/claim/[slug]/page.tsx', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const emptyComponent = () => null
  const plan = { name: 'Plan', monthlyLabel: '$99/mo', tagline: 'Manage your listing', features: [] }
  const modules: Record<string, unknown> = {
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND') } },
    'next/link': { default: ({ children, ...props }: { children: unknown }) => createElement('a', props, children as never) },
    '@/components/Navbar': { default: emptyComponent },
    '@/components/Footer': { default: emptyComponent },
    '@/data/supabase-clinics': { fetchClinicByExactSlug: async (slug: string) => clinics[slug] ?? null },
    '@/lib/config': { SITE_URL: 'https://glowroute.io' },
    '@/lib/seo-page-overrides': seoOverrides,
    '@/lib/stripe': { PLANS: { starter: plan, growth: plan, pro: plan } },
    './ClaimCheckoutButton': { default: emptyComponent },
    '@/components/PostHogClinicTracker': { trackClaimStarted: () => undefined },
  }
  const routeModule = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> }
  const scopedRequire = (name: string) => name in modules ? { __esModule: true, ...modules[name] as object } : require(name)
  new Script(compiled, { filename: 'app/claim/[slug]/page.tsx' }).runInNewContext({ module: routeModule, exports: routeModule.exports, require: scopedRequire })
  return routeModule.exports
}

function clinic(overrides: Partial<Clinic> = {}): Clinic {
  return { id: 'claim-test', name: 'Skintech Spa', slug: 'skintech-spa-fort-worth-tx', city: 'Fort Worth', state: 'TX', googleRating: 0, googleReviewCount: 0, treatments: [], verified: false, ...overrides }
}

function request(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

function assertNoindexFollow(metadata: unknown) {
  const robots = (metadata as { robots: { index: boolean; follow: boolean; googleBot: { index: boolean; follow: boolean } } }).robots
  assert.equal(robots.index, false)
  assert.equal(robots.follow, true)
  assert.equal(robots.googleBot.index, false)
  assert.equal(robots.googleBot.follow, true)
}

describe('individual claim page crawl and location facts', () => {
  it('emits noindex,follow and the clinic state for Fort Worth', async () => {
    const record = clinic()
    const page = loadClaimPage({ [record.slug]: record })
    const metadata = await page.generateMetadata(request(record.slug)) as { description: string; alternates: { canonical: string } }
    assertNoindexFollow(metadata)
    assert.match(metadata.description, /Skintech Spa in Fort Worth, TX\./)
    assert.doesNotMatch(metadata.description, /Fort Worth, FL/)
    assert.equal(metadata.alternates.canonical, 'https://glowroute.io/claim/skintech-spa-fort-worth-tx')
    const markup = renderToStaticMarkup(await page.default(request(record.slug)) as never)
    assert.match(markup, />Fort Worth, TX<\/p>/)
    assert.doesNotMatch(markup, /Fort Worth, FL/)
  })

  it('does not invent a state when a clinic has no recorded state', async () => {
    const record = clinic({ state: undefined })
    const page = loadClaimPage({ [record.slug]: record })
    const metadata = await page.generateMetadata(request(record.slug)) as { description: string }
    assertNoindexFollow(metadata)
    assert.match(metadata.description, /in Fort Worth\./)
    assert.doesNotMatch(metadata.description, /Fort Worth, (FL|TX)/)
    const markup = renderToStaticMarkup(await page.default(request(record.slug)) as never)
    assert.match(markup, />Fort Worth<\/p>/)
  })

  it('preserves locked SkinLocal title and canonical for both claim slugs', async () => {
    const record = clinic({ name: 'SkinLocal Dadeland', slug: 'skinlocal-dadeland-miami', city: 'Miami', state: 'FL' })
    const page = loadClaimPage({ [record.slug]: record })
    for (const slug of ['skinlocal-dadeland-miami', 'skinlocal-dadeland-miami-fl']) {
      const metadata = await page.generateMetadata(request(slug)) as { title: string; alternates: { canonical: string } }
      assertNoindexFollow(metadata)
      assert.equal(metadata.title, 'Claim SkinLocal Dadeland — GlowRoute')
      assert.equal(metadata.alternates.canonical, 'https://glowroute.io/claim/skinlocal-dadeland-miami')
    }
  })

  it('keeps fallback individual claim metadata out of search too', async () => {
    const page = loadClaimPage()
    const metadata = await page.generateMetadata(request('missing-clinic')) as { title: string }
    assertNoindexFollow(metadata)
    assert.equal(metadata.title, 'Claim Your Listing — GlowRoute')
    await assert.rejects(page.default(request('missing-clinic')), /NOT_FOUND/)
  })
})
