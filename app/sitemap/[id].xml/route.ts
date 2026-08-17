import { NextRequest } from 'next/server'
import { ARTICLES } from '@/data/articles'
import { INSIGHTS } from '@/data/insights'
import { TREATMENT_SLUGS } from '@/lib/treatments'
import { SITE_URL } from '@/lib/config'
import {
  citySlug,
  fetchSitemapCities,
  fetchSitemapClinicChunk,
  fetchTopClaimSlugs,
  SitemapDataError,
} from '@/lib/sitemap-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] as string)
}

function urlsetXml(urls: string[], today: string): string {
  const entries = urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`
}

async function buildUrls(chunkId: number, today: string): Promise<string[]> {
  const clinicRows = await fetchSitemapClinicChunk(chunkId)
  const clinicUrls = clinicRows.map((clinic) => `${SITE_URL}/clinics/${citySlug(clinic.city)}/${clinic.slug}`)

  if (chunkId !== 0) return clinicUrls

  const [cities, claimSlugs] = await Promise.all([
    fetchSitemapCities(),
    fetchTopClaimSlugs(200),
  ])
  const staticUrls = [
    SITE_URL,
    `${SITE_URL}/clinics`,
    `${SITE_URL}/claim`,
    `${SITE_URL}/treatments`,
    `${SITE_URL}/articles`,
    `${SITE_URL}/insights`,
    `${SITE_URL}/specialties`,
    `${SITE_URL}/quiz`,
    `${SITE_URL}/telehealth`,
    ...TREATMENT_SLUGS.map((slug) => `${SITE_URL}/treatments/${slug}`),
    ...cities.map((city) => `${SITE_URL}/clinics/${city}`),
    ...claimSlugs.map((slug) => `${SITE_URL}/claim/${slug}`),
    ...ARTICLES.map((article) => `${SITE_URL}/articles/${article.slug}`),
    ...INSIGHTS.map((insight) => `${SITE_URL}/insights/${insight.slug}`),
  ]

  return [...staticUrls, ...clinicUrls]
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const chunkId = Number(params.id)
  const today = new Date().toISOString().split('T')[0]

  if (!/^\d+$/.test(params.id) || !Number.isSafeInteger(chunkId)) {
    return new Response('Invalid sitemap chunk', { status: 400 })
  }

  try {
    const urls = await buildUrls(chunkId, today)
    return new Response(urlsetXml(urls, today), { status: 200, headers: XML_HEADERS })
  } catch (error) {
    const message = error instanceof SitemapDataError ? error.message : 'Unexpected sitemap failure'
    console.error(`[sitemap] chunk ${chunkId} failed:`, message)
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
