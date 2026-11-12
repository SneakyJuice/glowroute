const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { sourceLocation, stateCode } = require('./lib/source-integrity.cjs')
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
