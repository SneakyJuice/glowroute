/** Conservative publication checks. Never invent corrected facts. */
export function addressState(address?: string | null): string | null {
  return address?.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?(?:\s*,?\s*(?:USA|US|United States))?\s*$/i)?.[1].toUpperCase() ?? null
}
export function hasAddressStateConflict(record: { address?: string | null; state?: string | null }): boolean {
  const postalState = addressState(record.address)
  const state = record.state?.trim().toUpperCase()
  return !!postalState && !!state && /^[A-Z]{2}$/.test(state) && postalState !== state
}
export function publicImageUrl(value?: string | null): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return undefined
    if (Array.from(url.searchParams.keys()).some(key => /^(key|api[_-]?key|token|access_token)$/i.test(key))) return undefined
    if (/(^|\.)sitescout\.com$/.test(url.hostname)) return undefined
    if (/(^|\.)facebook\.com$/.test(url.hostname) && /^\/tr\/?$/i.test(url.pathname)) return undefined
    if (/(^|\.)userway\.org$/.test(url.hostname) && /spinner/i.test(url.pathname)) return undefined
    if (/(^|\.)flagcdn\.com$/.test(url.hostname)) return undefined
    if (/(^|\.)(unsplash\.com|pexels\.com|pixabay\.com)$/.test(url.hostname)) return undefined
    return value
  } catch { return undefined }
}
export function listingDescription(value?: string | null): string | undefined {
  if (!value) return undefined
  const text = value.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, ' ')
    .replace(/\[\s*\]\([^)]*\)/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '')
    .replace(/\s+/g, ' ').trim()
  return text ? text.slice(0, 1600) : undefined
}
export function clinicPath(city: string, slug: string): string {
  const normalized = city.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
  return `/clinics/${normalized}/${slug.replace(/^\/+/, '')}`
}
