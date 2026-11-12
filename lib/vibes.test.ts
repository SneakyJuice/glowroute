import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Clinic } from '../types/clinic.ts'
import { detectBookingPlatform, getVibeTags, safeHttpUrl } from './vibes.ts'

function clinic(overrides: Partial<Clinic> = {}): Clinic {
  return { id: 'test', name: 'Clinic', slug: 'clinic', city: 'Miami', googleRating: 0, googleReviewCount: 0, treatments: [], verified: false, ...overrides }
}

describe('clinic service tags', () => {
  it('does not classify female or women’s descriptions as men-focused', () => {
    for (const description of ['Female-focused wellness', "Women's health and skincare", 'Women’s aesthetic treatment', 'Treatments for women']) {
      assert.equal(getVibeTags(clinic({ description })).includes('Men-Focused'), false, description)
    }
  })

  it('recognizes actual men’s health signals including curly apostrophes', () => {
    for (const description of ["Men's health", 'Men’s wellness', 'Male hormone support', 'TRT consultations']) {
      assert.equal(getVibeTags(clinic({ description })).includes('Men-Focused'), true, description)
    }
  })

  it('recognizes hyphenated canonical service labels', () => {
    assert.ok(getVibeTags(clinic({ treatments: ['iv-therapy'] })).includes('Medical-Grade'))
    assert.ok(getVibeTags(clinic({ treatments: ['weight-loss-ozempic'] })).includes('Weight Loss'))
  })
})

describe('booking destinations', () => {
  it('recognizes a booking website when bookingUrl is absent', () => {
    const detected = detectBookingPlatform(clinic({ website: 'https://www.vagaro.com/impactglamour/services' }))
    assert.equal(detected?.platform, 'vagaro')
    assert.equal(detected?.url, 'https://www.vagaro.com/impactglamour/services')
  })

  it('matches actual platform hosts and subdomains, not URL text', () => {
    assert.equal(detectBookingPlatform(clinic({ website: 'https://clinic.example/?next=vagaro.com' })), null)
    assert.equal(detectBookingPlatform(clinic({ website: 'https://vagaro.com.attacker.example/clinic' })), null)
    assert.equal(detectBookingPlatform(clinic({ website: 'https://myclinic.acuityscheduling.com/' }))?.platform, 'acuity')
  })

  it('uses a valid explicit booking URL without inventing a platform', () => {
    const detected = detectBookingPlatform(clinic({ bookingUrl: 'https://clinic.example/book' }))
    assert.equal(detected?.platform, 'generic')
    assert.equal(detected?.url, 'https://clinic.example/book')
  })

  it('rejects executable, malformed, and credential-bearing destinations', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,test', 'https://user:password@clinic.example/', 'not a url']) {
      assert.equal(safeHttpUrl(value), null, value)
      assert.equal(detectBookingPlatform(clinic({ bookingUrl: value })), null, value)
    }
    assert.equal(safeHttpUrl('vagaro.com/impactglamour'), 'https://vagaro.com/impactglamour')
  })
})
