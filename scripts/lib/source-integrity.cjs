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
function hasReviewHold(row) {
  return row.needs_review === true || (typeof row.review_reason === 'string' && row.review_reason.trim() !== '')
}
function isAliasSource(row, aliases) {
  return !!aliases && (aliases.ids.has(row.id) || aliases.slugs.has(row.slug))
}
function preservePublicationVisibility(row, proposed, aliases) {
  if (row.visibility === 'removed') return 'removed'
  if (isAliasSource(row, aliases)) return 'hidden'
  if (row.visibility === 'hidden' || row.visibility === 'needs_review') return row.visibility
  // Completeness cannot clear an existing moderation decision or its reason.
  if (hasReviewHold(row)) return row.visibility || 'hidden'
  return proposed
}
async function loadSuppressedAliases(client) {
  const ids = new Set(), slugs = new Set()
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from('clinic_aliases')
      .select('source_clinic_id,alias_slug').order('alias_slug', { ascending: true })
      .range(offset, offset + pageSize - 1)
    // Fail closed: an unreadable protection list must never become an empty list.
    if (error) throw new Error('Cannot verify duplicate publication protection: ' + error.message)
    for (const alias of data || []) {
      if (alias.source_clinic_id) ids.add(alias.source_clinic_id)
      if (alias.alias_slug) slugs.add(alias.alias_slug)
    }
    if (!data || data.length < pageSize) break
  }
  return { ids, slugs }
}
module.exports = { sourceLocation, stateCode, hasReviewHold, isAliasSource, preservePublicationVisibility, loadSuppressedAliases }
