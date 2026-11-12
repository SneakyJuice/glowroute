import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { DirectoryQueryError, parseDirectoryCity, parseDirectoryQuery, searchDirectory, serializeDirectoryQuery } from './directory-search.ts'
import type { Clinic } from '../types/clinic.ts'

function clinic(id: string, overrides: Partial<Clinic> = {}): Clinic {
  return { id, slug: 'clinic-' + id, name: 'Provider ' + id, city: 'Miami', state: 'FL',
    googleRating: 0, googleReviewCount: 0, treatments: ['botox-fillers'], services: ['botox-fillers'],
    verified: false, visibility: 'visible', lat: 25.774, lng: -80.193, ...overrides }
}
const query = (value = '') => parseDirectoryQuery(new URLSearchParams(value))

describe('directory query validation and city parsing', () => {
  it('handles real city/state suffixes without stripping letters from city names', () => {
    assert.deepEqual(parseDirectoryCity('Miami, FL'), {city: 'Miami', state: 'FL'})
    assert.deepEqual(parseDirectoryCity('miami, fl'), {city: 'miami', state: 'FL'})
    assert.deepEqual(parseDirectoryCity('Santa Fe'), {city: 'Santa Fe', state: ''})
    assert.deepEqual(parseDirectoryCity('Flowery Branch'), {city: 'Flowery Branch', state: ''})
    assert.deepEqual(parseDirectoryCity('Buffalo, NY'), {city: 'Buffalo', state: 'NY'})
  })
  it('rejects malformed, nonfinite, fractional, zero, negative and oversized page inputs', () => {
    for (const value of ['NaN', 'Infinity', '-1', '0', '1.2', '5abc', '', '100001']) {
      assert.throws(() => query('page=' + value), DirectoryQueryError, value)
    }
    for (const value of ['NaN', 'Infinity', '-1', '0', '1.2', '101']) assert.throws(() => query('limit=' + value), DirectoryQueryError)
  })
  it('validates radius and coordinates and permits an explicit unrestricted radius', () => {
    assert.equal(query('city=Miami').distance, null)
    assert.equal(query().distance, 25)
    assert.equal(query('distance=any').distance, null)
    assert.equal(query('distance=5').distance, 5)
    for (const value of ['NaN', 'Infinity', '0', '-5']) assert.throws(() => query('distance=' + value), DirectoryQueryError)
    assert.throws(() => query('lat=25'), DirectoryQueryError)
    assert.throws(() => query('lat=95&lng=-80'), DirectoryQueryError)
    assert.throws(() => query('lat=25&lng=Infinity'), DirectoryQueryError)
  })
  it('round trips all supported filters and page state through a shareable URL', () => {
    const original = query('city=Los+Angeles%2C+CA&q=laser&goal=skin&goal=hair&specialty=laser-treatments&treatment=laser&distance=10&page=2&verified=true&booking=true&sort=Most+Reviewed')
    assert.deepEqual(parseDirectoryQuery(serializeDirectoryQuery(original)), original)
  })
  it('does not revive unsupported source-less rating or feature filters', () => {
    const parsed = query('rating=4.5&sort=Highest+Rated')
    assert.equal(parsed.filters.minRating, 0)
    assert.equal(parsed.sort, 'GlowScore™')
    assert.throws(() => query('telehealth=true'), DirectoryQueryError)
  })
})

describe('server directory search', () => {
  it('returns one bounded page from a large pool and never serializes the pool', () => {
    const pool = Array.from({length: 13000}, (_, n) => clinic(String(n).padStart(5, '0')))
    const first = searchDirectory(pool, query())
    assert.equal(first.total, 13000)
    assert.equal(first.count, 20)
    assert.equal(first.data.length, 20)
    assert.ok(JSON.stringify(first).length < 30000)
    const second = searchDirectory(pool, query('page=2'))
    assert.equal(second.data.length, 20)
    assert.ok(second.data.every(c => !first.data.some(a => a.id === c.id)))
    assert.equal(pool[0].id, '00000', 'search must not mutate cached source order')
  })
  it('honors goals, services, free text and specialty before pagination', () => {
    const pool = [clinic('a', {goals: ['rejuvenation']}), clinic('b', {name: 'Laser Care', services: ['laser-hair-removal'], treatments: [], goals: ['hair']}), clinic('c', {goals: ['hair']})]
    const found = searchDirectory(pool, query('q=laser&specialty=laser-treatments&treatment=laser&goal=hair&limit=1'))
    assert.deepEqual(found.data.map(c => c.id), ['b'])
    assert.equal(found.total, 1)
    assert.equal(searchDirectory(pool, query('goal=not-a-goal')).total, 0)
  })
  it('promotes only a matching featured record, counts it once, and keeps page boundaries contiguous', () => {
    const pool = [clinic('a'), clinic('b', {featured:true}), clinic('c'), clinic('d')]
    const first = searchDirectory(pool, query('limit=2'))
    assert.equal(first.featuredClinic?.id, 'b')
    assert.equal(first.total, 4)
    assert.equal(first.count, 2)
    assert.deepEqual(first.data.map(c => c.id), ['a'])
    const second = searchDirectory(pool, query('limit=2&page=2'))
    assert.equal(second.featuredClinic, null)
    assert.deepEqual(second.data.map(c => c.id), ['c', 'd'])
    assert.equal(searchDirectory(pool, query('q=Provider+a')).featuredClinic, null)
  })
  it('includes unrated records and never fabricates verification', () => {
    const pool = [clinic('unrated'), clinic('verified', {verified:true}), clinic('hidden', {visibility:'needs_review'})]
    assert.equal(searchDirectory(pool, query()).total, 2)
    assert.deepEqual(searchDirectory(pool, query('verified=true')).data.map(c => c.id), ['verified'])
  })
  it('uses actual distance and rejects faraway coordinates even when the city label says Miami', () => {
    const pool = [clinic('local-a'), clinic('local-b', {lat:25.78}), clinic('nearby', {city:'Miami Beach', lat:25.79, lng:-80.19}), clinic('twelve-miles', {city:'Other City', lat:25.95, lng:-80.19}), clinic('alaska', {lat:61.196362, lng:-149.8772077})]
    const fiveMiles = searchDirectory(pool, query('city=Miami%2C+FL&distance=5'))
    assert.equal(fiveMiles.distanceApplied, true)
    assert.equal(fiveMiles.cityLabel, 'Miami, FL')
    assert.ok(fiveMiles.data.some(c => c.id === 'nearby'))
    assert.ok(!fiveMiles.data.some(c => c.id === 'alaska'))
    assert.ok(!fiveMiles.data.some(c => c.id === 'twelve-miles'))
    assert.ok(searchDirectory(pool, query('distance=25')).data.some(c => c.id === 'twelve-miles'))
    const cityOnly = searchDirectory(pool, query('city=Miami&distance=any'))
    assert.ok(!cityOnly.data.some(c => c.id === 'nearby'))
  })
  it('falls back to exact city matching when geocodes are absent and explains radius availability', () => {
    const pool = [clinic('a', {lat:undefined,lng:undefined}), clinic('b', {city:'North Miami',lat:undefined,lng:undefined})]
    const found = searchDirectory(pool, query())
    assert.equal(found.distanceApplied, false)
    assert.deepEqual(found.data.map(c => c.id), ['a'])
  })
  it('supports near-me without forcing default Miami and clamps out-of-range pages safely', () => {
    const pool = [clinic('miami'), clinic('la', {city:'Los Angeles',state:'CA',lat:34.05,lng:-118.24})]
    const found = searchDirectory(pool, query('lat=34.05&lng=-118.24&distance=5&page=999'))
    assert.equal(found.cityLabel, 'Your location')
    assert.deepEqual(found.data.map(c => c.id), ['la'])
    assert.equal(found.page, 1)
  })
  it('cleared service filters restore the original set, including when the featured clinic matches', () => {
    const pool = [clinic('botox'), clinic('laser', {treatments:[],services:['laser']}), clinic('featured', {featured:true,treatments:[],services:['laser']})]
    const filtered = query('treatment=botox')
    assert.equal(searchDirectory(pool, filtered).total, 1)
    const cleared = query('city=Miami&distance=25')
    assert.equal(searchDirectory(pool, cleared).total, 3)
  })
  it('filters online booking by an actual booking URL or known booking platform, never a substring lookalike', () => {
    const pool = [clinic('booking', {bookingUrl:'https://clinic.example/appointments'}), clinic('vagaro', {website:'https://www.vagaro.com/clinic'}), clinic('lookalike', {website:'https://vagaro.com.unrelated.example/'}), clinic('no-booking')]
    assert.deepEqual(searchDirectory(pool, query('booking=true')).data.map(c => c.id).sort(), ['booking','vagaro'])
  })
})

describe('directory rendering architecture', () => {
  it('keeps all records server-side and uses the real initial page in the client tree', () => {
    for (const file of ['../app/page.tsx','../app/clinics/page.tsx']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      assert.doesNotMatch(source, /allClinics=|ssr-clinic-preview/)
      assert.match(source, /initialPage=/)
    }
    const source = readFileSync(new URL('../app/clinics/ClinicsClient.tsx', import.meta.url), 'utf8')
    assert.doesNotMatch(source, /IntersectionObserver|ssr-clinic-preview|allClinics/)
    assert.match(source, /useState\(initialPage\)/)
    assert.match(source, /AbortController/)
  })
})
