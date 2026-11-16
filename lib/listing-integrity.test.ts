import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addressState, hasAddressStateConflict, publicImageUrl, listingDescription, clinicPath, distinctClinicLocations } from './listing-integrity.ts'
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
  assert.equal(publicImageUrl('https://www.facebook.com/tr?id=123&ev=PageView'), undefined)
  assert.equal(publicImageUrl('https://cdn.userway.org/widgetapp/images/spinner.svg'), undefined)
  assert.equal(publicImageUrl('https://flagcdn.com/w320/us.png'), undefined)
  assert.equal(publicImageUrl('https://clinic.example/portraits/userway-doctor.jpg'), 'https://clinic.example/portraits/userway-doctor.jpg')
})
test('converts imported markdown to text and preserves non-Latin content', () => {
  assert.equal(listingDescription('[![Logo](https://x/logo.png)](https://x) [Search](https://x/search) Skin clinic'), 'Search Skin clinic')
  assert.equal(listingDescription('Clinique santé • 日本語'), 'Clinique santé • 日本語')
})

test('does not publish scraped consent, browser warnings, or anti-copy messages as clinic biographies', () => {
  assert.equal(listingDescription('By using this website you agree to our use of cookies. We use cookies to provide you with a great experience.'), undefined)
  assert.equal(listingDescription('This site has limited support for your browser. We recommend switching to Chrome.'), undefined)
  assert.equal(listingDescription('You cannot copy content of this page. Your IP is being recorded.'), undefined)
  assert.equal(listingDescription('Our clinic offers skin consultations. See our website for cookie preferences.'), 'Our clinic offers skin consultations. See our website for cookie preferences.')
})
test('profile paths use the stored city', () => {
  assert.equal(clinicPath('Miami Beach', '/belle'), '/clinics/miami-beach/belle')
})

test('city previews repeat neither a name/address pair nor conflate branches or co-located businesses', () => {
  const rows = [
    {slug:'first',name:'Clinic One',address:'100 Main St.'},
    {slug:'duplicate',name:'CLINIC ONE',address:'100 Main St'},
    {slug:'branch',name:'Clinic One',address:'200 Main St'},
    {slug:'doctor',name:'Dr. Two',address:'100 Main St'},
    {slug:'unknown-a',name:'Clinic One'},
    {slug:'unknown-b',name:'Clinic One'},
  ]
  assert.deepEqual(distinctClinicLocations(rows).map(row=>row.slug), ['first','branch','doctor','unknown-a','unknown-b'])
  assert.equal(rows.length,6)
})
