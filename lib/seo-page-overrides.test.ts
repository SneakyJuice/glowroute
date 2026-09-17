import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  CLAIM_SLUG_OVERRIDES,
  GUIDE_YEAR,
  NEARBY_MAX_MILES,
  MIAMI_CITY_METADATA,
  MIAMI_NEARBY_HUBS,
  MIAMI_VIEW_ALL_HREF,
  QUIZ_METADATA,
  SITEMAP0_LOCKED_PATHS,
  buildCityHubSeo,
  cityHubKeywords,
  cityHubViewAllHref,
  clinicClaimPromoCopy,
  clinicSlugLookupCandidates,
  getCitySeoOverride,
  getClaimSeoOverride,
  getClinicSeoOverride,
  isClaimSlugInSitemap,
  sanitizeSeoText,
  selectNearbyCityHubs,
  showClinicVerifiedPromo,
} from './seo-page-overrides.ts'

describe('Miami city hub SEO', () => {
  it('locks Miami title, description, keywords, and view-all', () => {
    const miami = getCitySeoOverride('miami')
    assert.ok(miami)
    assert.equal(miami.title, 'Best MedSpas in Miami, FL — GlowRoute')
    assert.equal(
      miami.description,
      'Find medical spas and aesthetic clinics in Miami, FL. Compare Botox, HydraFacial, laser, and more on GlowRoute.',
    )
    assert.equal(miami.description.includes('verified'), false)
    assert.match(miami.description, /^[^\d]*$/)
    assert.deepEqual(miami.keywords, [
      'Miami medspa',
      'Miami medical spa',
      'Botox Miami',
      'HydraFacial Miami',
      'aesthetic clinic Miami',
    ])
    assert.equal(miami.viewAllHref, '/clinics?city=Miami')
    assert.equal(miami.canonicalPath, '/clinics/miami')
    assert.equal(MIAMI_VIEW_ALL_HREF, '/clinics?city=Miami')
    assert.equal(MIAMI_CITY_METADATA.viewAllHref, '/clinics?city=Miami')
  })

  it('lists only the locked live nearby hubs', () => {
    assert.deepEqual([...MIAMI_NEARBY_HUBS], [
      'miami-beach',
      'coral-gables',
      'aventura',
      'doral',
      'fort-lauderdale',
      'hollywood',
      'boca-raton',
      'kendall',
      'hialeah',
      'pembroke-pines',
    ])
    const miami = getCitySeoOverride('miami')
    assert.deepEqual(miami?.nearbyHubs, [...MIAMI_NEARBY_HUBS])
  })

  it('uses the same template path for other city hubs instead of a one-off metro list', () => {
    const tampa = getCitySeoOverride('tampa', { stateAbbr: 'FL' })
    const miamiBeach = getCitySeoOverride('miami-beach', { stateAbbr: 'FL' })
    assert.ok(tampa)
    assert.ok(miamiBeach)
    assert.equal(tampa.title, 'Best MedSpas in Tampa, FL — GlowRoute')
    assert.equal(miamiBeach.canonicalPath, '/clinics/miami-beach')
    assert.notEqual(tampa.nearbyHubs, MIAMI_NEARBY_HUBS)
  })
})

const LIVE_HUB_FIXTURES = [
  { slug: 'tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
  { slug: 'st-petersburg', state: 'FL', lat: 27.7676, lng: -82.6403 },
  { slug: 'clearwater', state: 'FL', lat: 27.9659, lng: -82.8001 },
  { slug: 'orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { slug: 'lakeland', state: 'FL', lat: 28.0395, lng: -81.9498 },
  { slug: 'miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { slug: 'miami-beach', state: 'FL', lat: 25.7907, lng: -80.13 },
  { slug: 'coral-gables', state: 'FL', lat: 25.7215, lng: -80.2684 },
  { slug: 'atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  { slug: 'alpharetta', state: 'GA', lat: 34.0754, lng: -84.2941 },
  { slug: 'columbus', state: 'GA', lat: 32.461, lng: -84.9877 },
  { slug: 'savannah', state: 'GA', lat: 32.0809, lng: -81.0912 },
  { slug: 'abilene', state: 'TX', lat: 32.4487, lng: -99.7331 },
  { slug: 'denton', state: 'TX', lat: 33.2148, lng: -97.1331 },
  { slug: 'farmers-branch', state: 'TX', lat: 32.9265, lng: -96.8967 },
  { slug: 'grapevine', state: 'TX', lat: 32.9343, lng: -97.0781 },
  { slug: 'irving', state: 'TX', lat: 32.814, lng: -96.9489 },
  { slug: 'southlake', state: 'TX', lat: 32.9412, lng: -97.1342 },
  { slug: 'lubbock', state: 'TX', lat: 33.5779, lng: -101.8552 },
  { slug: 'midland', state: 'TX', lat: 31.9973, lng: -102.0779 },
  { slug: 'odessa', state: 'TX', lat: 31.8457, lng: -102.3676 },
  { slug: 'new-york', state: 'NY', lat: 40.7128, lng: -74.006 },
  { slug: 'long-island-city', state: 'NY', lat: 40.7447, lng: -73.9485 },
  { slug: 'los-angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { slug: 'santa-monica', state: 'CA', lat: 34.0195, lng: -118.4912 },
  { slug: 'seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
] as const

const DEFAULT_PACK_TERMS = ['semaglutide', 'peptide therapy', 'iv therapy', 'filler']

function assertCityLocalKeywords(keywords: readonly string[], city: string) {
  const joined = keywords.join(' ').toLowerCase()
  for (const term of DEFAULT_PACK_TERMS) {
    assert.equal(joined.includes(term), false, `${city} keywords leaked "${term}"`)
  }
  if (city.toLowerCase() !== 'tampa') {
    assert.equal(joined.includes('tampa'), false, `${city} keywords leaked Tampa`)
  }
  assert.deepEqual(keywords, [
    `${city} medspa`,
    `${city} medical spa`,
    `Botox ${city}`,
    `HydraFacial ${city}`,
    `aesthetic clinic ${city}`,
  ])
}

describe('City hub SEO template', () => {
  it('builds Miami-pattern metadata for sample hubs without counts or verified copy', () => {
    const samples = [
      { slug: 'tampa', city: 'Tampa', state: 'FL' },
      { slug: 'orlando', city: 'Orlando', state: 'FL' },
      { slug: 'atlanta', city: 'Atlanta', state: 'GA' },
      { slug: 'new-york', city: 'New York', state: 'NY' },
      { slug: 'los-angeles', city: 'Los Angeles', state: 'CA' },
    ]

    for (const sample of samples) {
      const seo = buildCityHubSeo(sample.slug, { stateAbbr: sample.state })
      assert.equal(seo.title, `Best MedSpas in ${sample.city}, ${sample.state} — GlowRoute`)
      assert.equal(
        seo.description,
        `Find medical spas and aesthetic clinics in ${sample.city}, ${sample.state}. Compare Botox, HydraFacial, laser, and more on GlowRoute.`,
      )
      assert.equal(seo.description.includes('verified'), false)
      assert.match(seo.description, /^[^\d]*$/)
      assert.equal(seo.canonicalPath, `/clinics/${sample.slug}`)
      assert.equal(seo.viewAllHref, `/clinics?city=${encodeURIComponent(sample.city)}`)
      assertCityLocalKeywords(seo.keywords, sample.city)
    }
  })

  it('keeps Tampa in Tampa keywords and drops the national default pack', () => {
    const keywords = cityHubKeywords('Tampa')
    assert.ok(keywords.some((keyword) => keyword.includes('Tampa')))
    assert.equal(keywords.join(' ').toLowerCase().includes('semaglutide'), false)
    assert.notDeepEqual(
      keywords,
      ['medspa', 'aesthetic clinic', 'botox', 'filler', 'semaglutide', 'peptide therapy', 'IV therapy', 'Tampa'],
    )
  })

  it('uses display-name view-all query params only', () => {
    assert.equal(cityHubViewAllHref('Miami'), '/clinics?city=Miami')
    assert.equal(cityHubViewAllHref('Orlando'), '/clinics?city=Orlando')
    assert.equal(cityHubViewAllHref('New York'), '/clinics?city=New%20York')
    assert.equal(cityHubViewAllHref('Los Angeles'), '/clinics?city=Los%20Angeles')
    assert.equal(cityHubViewAllHref('Miami').includes('/clinics/miami'), false)
    assert.notEqual(cityHubViewAllHref('Tampa'), '/clinics')
  })

  it('omits state from title and description when state is unknown', () => {
    const seo = buildCityHubSeo('denver')
    assert.equal(seo.title, 'Best MedSpas in Denver — GlowRoute')
    assert.equal(
      seo.description,
      'Find medical spas and aesthetic clinics in Denver. Compare Botox, HydraFacial, laser, and more on GlowRoute.',
    )
    assert.equal(seo.viewAllHref, '/clinics?city=Denver')
  })
})

describe('City hub nearby neighbors', () => {
  it('keeps the locked Miami nearby list', () => {
    assert.deepEqual(selectNearbyCityHubs('miami', LIVE_HUB_FIXTURES), [...MIAMI_NEARBY_HUBS])
  })

  it('returns only live, geographically sensible hubs — not the national list', () => {
    const tampa = selectNearbyCityHubs('tampa', LIVE_HUB_FIXTURES)
    assert.ok(tampa.includes('st-petersburg'))
    assert.ok(tampa.includes('clearwater'))
    assert.ok(tampa.includes('lakeland'))
    assert.equal(tampa.includes('tampa'), false)
    assert.equal(tampa.includes('seattle'), false)
    assert.equal(tampa.includes('los-angeles'), false)
    assert.equal(tampa.includes('new-york'), false)
    assert.equal(tampa.includes('atlanta'), false)

    const atlanta = selectNearbyCityHubs('atlanta', LIVE_HUB_FIXTURES)
    assert.ok(atlanta.includes('alpharetta'))
    assert.equal(atlanta.includes('savannah'), false)
    assertAtlantaExcludesColumbusIfBeyondMax(atlanta)

    const newYork = selectNearbyCityHubs('new-york', LIVE_HUB_FIXTURES)
    assert.deepEqual(newYork, ['long-island-city'])

    const losAngeles = selectNearbyCityHubs('los-angeles', LIVE_HUB_FIXTURES)
    assert.deepEqual(losAngeles, ['santa-monica'])
  })

  it('does not invent cities that are not live hubs', () => {
    const nearby = selectNearbyCityHubs('tampa', LIVE_HUB_FIXTURES)
    assert.equal(nearby.includes('brandon'), false)
    assert.equal(nearby.includes('made-up-city'), false)
    for (const slug of nearby) {
      assert.ok(LIVE_HUB_FIXTURES.some((hub) => hub.slug === slug))
    }
  })

  it('returns no national fallback when a hub has no geo neighbors', () => {
    assert.deepEqual(selectNearbyCityHubs('seattle', LIVE_HUB_FIXTURES), [])
    assert.deepEqual(selectNearbyCityHubs('tampa', []), [])
  })

  it('never includes a live hub beyond the hard 100-mile max, including same-state fill', () => {
    assert.equal(NEARBY_MAX_MILES, 100)
    const dfwFar = ['denton', 'farmers-branch', 'grapevine', 'irving', 'southlake', 'lubbock', 'midland', 'odessa']
    const abilene = selectNearbyCityHubs('abilene', LIVE_HUB_FIXTURES)
    for (const slug of dfwFar) {
      assert.equal(abilene.includes(slug), false, `Abilene nearby leaked far hub ${slug}`)
    }
    assert.ok(abilene.length <= 10)

    const atlanta = selectNearbyCityHubs('atlanta', LIVE_HUB_FIXTURES)
    assert.ok(atlanta.includes('alpharetta'))
    assert.equal(atlanta.includes('savannah'), false)
    assertAtlantaExcludesColumbusIfBeyondMax(atlanta)

    const origins = ['tampa', 'orlando', 'atlanta', 'abilene', 'new-york', 'los-angeles']
    for (const originSlug of origins) {
      const origin = LIVE_HUB_FIXTURES.find((hub) => hub.slug === originSlug)
      assert.ok(origin)
      const nearby = selectNearbyCityHubs(originSlug, LIVE_HUB_FIXTURES)
      for (const slug of nearby) {
        const hub = LIVE_HUB_FIXTURES.find((item) => item.slug === slug)
        assert.ok(hub, `invented hub ${slug}`)
        const miles = fixtureMiles(origin, hub)
        assert.ok(miles <= NEARBY_MAX_MILES, `${originSlug} → ${slug} is ${miles.toFixed(1)} mi`)
      }
    }
  })
})

function assertAtlantaExcludesColumbusIfBeyondMax(atlanta: readonly string[]) {
  const origin = LIVE_HUB_FIXTURES.find((hub) => hub.slug === 'atlanta')
  const columbus = LIVE_HUB_FIXTURES.find((hub) => hub.slug === 'columbus')
  assert.ok(origin)
  assert.ok(columbus)
  if (fixtureMiles(origin, columbus) > NEARBY_MAX_MILES) {
    assert.equal(atlanta.includes('columbus'), false)
  }
}

function fixtureMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earthMiles = 3958.8
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return earthMiles * 2 * Math.asin(Math.sqrt(h))
}

describe('City hub page wiring', () => {
  it('uses the shared template, geo neighbors, and city view-all on every hub', () => {
    const page = readFileSync(new URL('../app/clinics/[city]/page.tsx', import.meta.url), 'utf8')
    assert.match(page, /buildCityHubSeo|getCitySeoOverride/)
    assert.match(page, /selectNearbyCityHubs/)
    assert.match(page, /viewAllHref/)
    assert.match(page, /keywords:\s*\[\.\.\.seo\.keywords\]|keywords:\s*\[\.\.\.cityOverride\.keywords\]|keywords:\s*\[\.\.\.\w+\.keywords\]/)
    assert.doesNotMatch(page, /fetchAllClinicsFromSupabase/)
    assert.doesNotMatch(page, /href=\{[^}]*\?\? '\/clinics'/)
    const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
    assert.match(layout, /semaglutide, peptide therapy, IV therapy, Tampa/)
  })
})

describe('Miami Plastic Surgery clinic SEO', () => {
  it('overrides the locked Miami clinic slug and -fl alias', () => {
    const clinic = getClinicSeoOverride('miami', 'miami-plastic-surgery-miami')
    const alias = getClinicSeoOverride('miami', 'miami-plastic-surgery-miami-fl')
    assert.ok(clinic)
    assert.deepEqual(clinic, alias)
    assert.equal(clinic.backHref, '/clinics/miami')
    assert.equal(clinic.title.includes('Verified'), false)
    assert.equal(clinic.description.includes('430+'), false)
    assert.equal(clinic.description.includes('Verified'), false)
    assert.ok(clinic.keywords.length > 0)
    assert.equal(clinic.keywords.join(' ').includes('semaglutide'), false)
    assert.equal(clinic.keywords.join(' ').includes('Tampa'), false)
    assert.equal(clinic.canonicalPath, '/clinics/miami/miami-plastic-surgery-miami')
  })

  it('does not override unrelated clinic slugs', () => {
    assert.equal(getClinicSeoOverride('miami', 'lux-medspa-brickell'), undefined)
    assert.equal(getClinicSeoOverride('tampa', 'miami-plastic-surgery-miami'), undefined)
  })

  it('does not render 430+ or Verified promo on the locked clinic route', () => {
    const clinic = getClinicSeoOverride('miami', 'miami-plastic-surgery-miami')
    const alias = getClinicSeoOverride('miami', 'miami-plastic-surgery-miami-fl')
    assert.ok(clinic)
    assert.equal(clinic.suppressRankingPromo, true)
    assert.equal(alias?.suppressRankingPromo, true)

    const copy = clinicClaimPromoCopy(clinic)
    assert.notEqual(copy, undefined)
    assert.equal((copy ?? '').includes('430+'), false)
    assert.equal(/verified/i.test(copy ?? ''), false)
    assert.equal(showClinicVerifiedPromo(clinic), false)
    assert.equal(showClinicVerifiedPromo(undefined), true)

    const defaultCopy = clinicClaimPromoCopy(undefined)
    assert.match(defaultCopy ?? '', /430\+/)

    const page = readFileSync(new URL('../app/clinics/[city]/[slug]/page.tsx', import.meta.url), 'utf8')
    assert.match(page, /clinicClaimPromoCopy/)
    assert.match(page, /showClinicVerifiedPromo/)
    assert.doesNotMatch(page, /430\+ patients searched your area last month/)
  })
})

describe('SkinLocal claim SEO', () => {
  it('overrides the locked claim slug and keeps it out of the sitemap', () => {
    const claim = getClaimSeoOverride('skinlocal-dadeland-miami')
    const alias = getClaimSeoOverride('skinlocal-dadeland-miami-fl')
    assert.ok(claim)
    assert.deepEqual(claim, alias)
    assert.equal(claim.canonicalPath, '/claim/skinlocal-dadeland-miami')
    assert.equal(claim.backHref, '/clinics/miami/skinlocal-dadeland-miami')
    assert.ok(claim.keywords.length > 0)
    assert.equal(claim.keywords.join(' ').includes('Tampa'), false)
    assert.equal(isClaimSlugInSitemap('skinlocal-dadeland-miami'), false)
    assert.equal(isClaimSlugInSitemap('skinlocal-dadeland-miami-fl'), false)
    assert.ok(CLAIM_SLUG_OVERRIDES['skinlocal-dadeland-miami'])
  })

  it('looks up claim clinics by locked slug and -fl alias', () => {
    assert.deepEqual(clinicSlugLookupCandidates('skinlocal-dadeland-miami'), [
      'skinlocal-dadeland-miami',
      'skinlocal-dadeland-miami-fl',
    ])
    assert.deepEqual(clinicSlugLookupCandidates('skinlocal-dadeland-miami-fl'), [
      'skinlocal-dadeland-miami-fl',
      'skinlocal-dadeland-miami',
    ])
  })
})

describe('Quiz and Botox guide SEO', () => {
  it('locks quiz metadata without matching or email claims', () => {
    assert.equal(QUIZ_METADATA.title, 'GlowRoute Treatment Quiz')
    assert.equal(QUIZ_METADATA.description, 'A short quiz to explore GlowRoute treatment options.')
    assert.equal(QUIZ_METADATA.canonicalPath, '/quiz')
    assert.deepEqual(QUIZ_METADATA.keywords, [])
    assert.equal(/match|email|subscribe|saved-result/i.test(QUIZ_METADATA.description), false)
  })

  it('uses 2026 for cost guides and adds botox-cost to sitemap 0 only', () => {
    assert.equal(GUIDE_YEAR, 2026)
    assert.deepEqual(SITEMAP0_LOCKED_PATHS, ['/guides/botox-cost'])
    assert.equal(SITEMAP0_LOCKED_PATHS.some((path) => path.startsWith('/claim/')), false)
    const sitemapBuild = readFileSync(new URL('./sitemap-build.ts', import.meta.url), 'utf8')
    assert.match(sitemapBuild, /SITEMAP0_LOCKED_PATHS/)
    assert.doesNotMatch(sitemapBuild, /\/claim\/\$\{/)
    assert.match(sitemapBuild, /\$\{SITE_URL\}\/quiz/)
    assert.match(sitemapBuild, /\$\{SITE_URL\}\/claim/)
  })
})

describe('sanitizeSeoText', () => {
  it('strips 430+ ranking claims from metadata strings', () => {
    assert.equal(
      sanitizeSeoText('430+ patients searched Miami last month'),
      'patients searched Miami last month',
    )
  })
})
