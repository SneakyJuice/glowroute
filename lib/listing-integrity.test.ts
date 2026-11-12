import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addressState, hasAddressStateConflict, publicImageUrl, listingDescription, clinicPath } from './listing-integrity.ts'
test('detects the Alaska listing tagged Florida without guessing neighborhood cities', () => {
  assert.equal(addressState('2600 Denali St Ste 101, Anchorage, AK 99503'), 'AK')
  assert.equal(hasAddressStateConflict({ address: '2600 Denali St Ste 101, Anchorage, AK 99503', state: 'FL' }), true)
  assert.equal(hasAddressStateConflict({ address: '123 Main St, Miami, FL 33101', state: 'FL' }), false)
  assert.equal(hasAddressStateConflict({ address: '123 Main St', state: 'FL' }), false)
})
test('blocks credential image URLs and generic stock without blocking clinic photos', () => {
  assert.equal(publicImageUrl('https://maps.googleapis.com/photo?key=secret'), undefined)
  assert.equal(publicImageUrl('https://images.unsplash.com/example'), undefined)
  assert.equal(publicImageUrl('javascript:alert(1)'), undefined)
  assert.equal(publicImageUrl('https://clinic.example/photo.jpg'), 'https://clinic.example/photo.jpg')
})
test('converts imported markdown to text and preserves non-Latin content', () => {
  assert.equal(listingDescription('[![Logo](https://x/logo.png)](https://x) [Search](https://x/search) Skin clinic'), 'Search Skin clinic')
  assert.equal(listingDescription('Clinique santé • 日本語'), 'Clinique santé • 日本語')
})
test('profile paths use the stored city', () => {
  assert.equal(clinicPath('Miami Beach', '/belle'), '/clinics/miami-beach/belle')
})
