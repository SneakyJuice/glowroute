// Source facts and discovery scope are separate. A search for Miami is not proof of location.
const names = 'Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|District of Columbia'.split('|')
const codes = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' ')
function stateCode(value) {
  const text = String(value || '').trim()
  return /^[A-Z]{2}$/i.test(text) ? text.toUpperCase() : codes[names.findIndex(name => name.toLowerCase() === text.toLowerCase())] || null
}
function sourceLocation(place, targetCity, targetState) {
  const address = place.address || place.street || ''
  const postal = address.match(/(?:,\s*([^,]+),?\s+)?\b([A-Z]{2})\s+\d{5}(?:-\d{4})?(?:\s*,?\s*(?:USA|US|United States))?\s*$/i)
  const city = String(place.city || postal?.[1] || '').trim()
  const state = postal?.[2].toUpperCase() || stateCode(place.state || place.stateCode) || null
  const target = stateCode(targetState)
  const reason = !city || !state ? 'Source location is incomplete' : target && state !== target ? 'Source state differs from discovery state' : null
  return { city, state, discovery_city: targetCity, discovery_state: target, needs_review: !!reason, review_reason: reason }
}
module.exports = { sourceLocation, stateCode }
