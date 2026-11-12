const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { sourceLocation, stateCode, hasReviewHold, isAliasSource, preservePublicationVisibility, loadSuppressedAliases } = require('./lib/source-integrity.cjs')
test('an Alaska Apify result never inherits the Miami discovery city/state', () => {
  const result = sourceLocation({ address: '2600 Denali St Ste 101, Anchorage, AK 99503', city: 'Anchorage', state: 'Alaska' }, 'Miami', 'FL')
  assert.equal(result.city, 'Anchorage'); assert.equal(result.state, 'AK'); assert.equal(result.needs_review, true)
  assert.equal(result.discovery_city, 'Miami')
})
test('an incomplete result is flagged instead of filled with discovery location', () => {
  const result = sourceLocation({}, 'Miami', 'FL')
  assert.equal(result.city, ''); assert.equal(result.state, null); assert.equal(result.needs_review, true)
})
test('postal evidence and full state names normalize correctly', () => {
  assert.equal(sourceLocation({address:'1 Main St, Tampa, FL 33601'}, 'Tampa', 'FL').city, 'Tampa')
  assert.equal(stateCode('Massachusetts'), 'MA'); assert.equal(stateCode('Maryland'), 'MD')
  assert.equal(stateCode('New York'), 'NY'); assert.equal(stateCode('District of Columbia'), 'DC')
})
test('the completeness job does not write or replace ratings', () => {
  const text = readFileSync(require.resolve('./quality-visibility-score.js'), 'utf8')
  assert.doesNotMatch(text, /\.update\(\{[^}]*glow_score/)
  assert.match(text, /!process\.argv\.includes\('--apply'\)/)
})

test('completeness cannot republish quarantined, removed, or aliased records', () => {
  const aliases = { ids: new Set(['suppressed-id']), slugs: new Set(['old-url']) }
  assert.equal(preservePublicationVisibility({visibility:'hidden'}, 'visible', aliases), 'hidden')
  assert.equal(preservePublicationVisibility({visibility:'needs_review'}, 'visible', aliases), 'needs_review')
  assert.equal(preservePublicationVisibility({visibility:'removed'}, 'visible', aliases), 'removed')
  assert.equal(preservePublicationVisibility({needs_review:true}, 'visible', aliases), 'hidden')
  assert.equal(preservePublicationVisibility({visibility:'hidden',review_reason:'duplicate:batch'}, 'visible', aliases), 'hidden')
  assert.equal(preservePublicationVisibility({id:'suppressed-id',visibility:'visible'}, 'visible', aliases), 'hidden')
  assert.equal(preservePublicationVisibility({slug:'old-url'}, 'visible', aliases), 'hidden')
  assert.equal(preservePublicationVisibility({visibility:'visible'}, 'visible', aliases), 'visible')
  assert.equal(preservePublicationVisibility({}, 'visible', aliases), 'visible')
  assert.equal(hasReviewHold({review_reason:'Source state differs from discovery state'}), true)
  assert.equal(isAliasSource({id:'suppressed-id',slug:'new-import-slug'}, aliases), true)
})

test('alias protection loads every page by stable slug and includes IDs and historical slugs', async () => {
  const first = Array.from({length:1000},(_,i)=>({source_clinic_id:'id-'+i,alias_slug:'slug-'+i}))
  const pages = [first,[{source_clinic_id:'last-id',alias_slug:'last-slug'}]]
  const ranges=[]
  const client={from(table){assert.equal(table,'clinic_aliases');return {select(columns){assert.equal(columns,'source_clinic_id,alias_slug');return {order(column){assert.equal(column,'alias_slug');return {async range(start,end){ranges.push([start,end]);return {data:pages.shift(),error:null}}}}}}}}}
  const aliases=await loadSuppressedAliases(client)
  assert.equal(aliases.ids.size,1001)
  assert.equal(aliases.slugs.has('last-slug'),true)
  assert.deepEqual(ranges,[[0,999],[1000,1999]])
})

test('unavailable duplicate protection fails closed before an intake can write', async () => {
  const client={from(){return {select(){return {order(){return {async range(){return {data:null,error:{message:'permission denied'}}}}}}}}}}
  await assert.rejects(loadSuppressedAliases(client),/Cannot verify duplicate publication protection/)
})
