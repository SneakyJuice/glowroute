import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  CLAIM_SLUG_OVERRIDES,
  GUIDE_YEAR,
  MIAMI_CITY_METADATA,
  MIAMI_NEARBY_HUBS,
  MIAMI_VIEW_ALL_HREF,
  QUIZ_METADATA,
  SITEMAP0_LOCKED_PATHS,
  clinicClaimPromoCopy,
  clinicSlugLookupCandidates,
  getCitySeoOverride,
  getClaimSeoOverride,
  getClinicSeoOverride,
  isClaimSlugInSitemap,
  sanitizeSeoText,
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

  it('does not override other city hubs', () => {
    assert.equal(getCitySeoOverride('tampa'), undefined)
    assert.equal(getCitySeoOverride('miami-beach'), undefined)
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
