import { NextRequest, NextResponse } from 'next/server'
import ical from 'ical'

const CACHE = new Map<string, { slots: Date[], expires: number }>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

function parseICal(data: string): Date[] {
  try {
    const parsed = ical.parseICS(data)
    const slots: Date[] = []
    for (const key in parsed) {
      const event = parsed[key]
      // Ensure it's a VEVENT and has start/end
      if (event.type === 'VEVENT' && event.start && event.end) {
        const start = event.start
        const end = event.end
        // Only include future events within next 14 days
        if (start.getTime() > Date.now() && start.getTime() < Date.now() + 14 * 24 * 60 * 60 * 1000) {
          slots.push(start)
        }
      }
    }
    slots.sort((a, b) => a.getTime() - b.getTime())
    return slots.slice(0, 3) // Return next 3 available slots
  } catch (err) {
    console.error('[API/availability] Failed to parse iCal:', err)
    return []
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const icalUrl = searchParams.get('icalUrl')

  if (!icalUrl) {
    return NextResponse.json({ error: 'icalUrl parameter is required' }, { status: 400 })
  }

  const cached = CACHE.get(icalUrl)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ slots: cached.slots })
  }

  try {
    // Note: External iCal fetching needs to be robust. May need `unstable_noStore` for Next.js 14.2.X
    // or specific `fetch` options to prevent caching issues on Vercel deployment.
    const res = await fetch(icalUrl, { next: { revalidate: 300 } })
    if (!res.ok) {
      console.error(`[API/availability] Failed to fetch ${icalUrl}: HTTP ${res.status}`)
      // Fallback: don't return error to client, just empty slots
      return NextResponse.json({ slots: [] })
    }
    const text = await res.text()
    const slots = parseICal(text)
    CACHE.set(icalUrl, { slots, expires: Date.now() + CACHE_TTL })
    return NextResponse.json({ slots })
  } catch (err) {
    console.error('[API/availability] Error fetching or parsing iCal:', err)
    return NextResponse.json({ slots: [] })
  }
}

export const runtime = 'nodejs' // This is a server-only API route
