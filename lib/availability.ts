const CACHE = new Map<string, { slots: Date[], expires: number }>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export async function fetchAvailability(icalUrl?: string): Promise<{ nextSlot: Date | null, slots: Date[] }> {
  if (!icalUrl) return { nextSlot: null, slots: [] }

  const cached = CACHE.get(icalUrl)
  if (cached && cached.expires > Date.now()) {
    return { nextSlot: cached.slots[0] ?? null, slots: cached.slots }
  }

  try {
    const res = await fetch(`/api/availability?icalUrl=${encodeURIComponent(icalUrl)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const slots = data.slots.map((s: string) => new Date(s)) // Convert string back to Date objects
    const nextSlot = slots[0] ?? null
    CACHE.set(icalUrl, { slots, expires: Date.now() + CACHE_TTL })
    return { nextSlot, slots }
  } catch (err) {
    console.warn('[availability] Failed to fetch availability from API:', err)
    return { nextSlot: null, slots: [] }
  }
}

export function formatSlot(date: Date): string {
  const now = new Date()
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  if (diffDays === 1) return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}