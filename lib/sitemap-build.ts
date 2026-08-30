import { ARTICLES } from '@/data/articles'
import { SITE_URL } from '@/lib/config'
import { TREATMENT_SLUGS } from '@/lib/treatments'
import {
  SITEMAP_CHUNK_SIZE,
  SitemapDataError,
  citySlug,
  fetchSitemapCities,
  fetchSitemapClinicChunk,
  fetchSitemapClinicCount,
} from '@/lib/sitemap-data'

export const SITEMAP_XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] as string)
}

export function xmlResponse(body: string): Response {
  return new Response(body, { status: 200, headers: SITEMAP_XML_HEADERS })
}

export function renderUrlset(urls: string[], lastmod: string): string {
  const entries = urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`
}

export function renderSitemapIndex(chunkIds: number[], lastmod: string): string {
  const entries = chunkIds
    .map(
      (id) =>
        `  <sitemap>\n    <loc>${SITE_URL}/sitemap/${id}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`
}

/** Live 200 surfaces only. No /shop, /products, claim slugs, or 308 insight articles. */
export function staticSitemapUrls(): string[] {
  return [
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
    ...ARTICLES.map((article) => `${SITE_URL}/articles/${article.slug}`),
  ]
}

export async function buildChunkUrls(chunkId: number): Promise<string[]> {
  const clinicRows = await fetchSitemapClinicChunk(chunkId)
  const clinicUrls = clinicRows.map(
    (clinic) => `${SITE_URL}/clinics/${citySlug(clinic.city)}/${clinic.slug}`,
  )

  if (chunkId !== 0) return clinicUrls

  const cities = await fetchSitemapCities()
  return [
    ...staticSitemapUrls(),
    ...cities.map((city) => `${SITE_URL}/clinics/${city}`),
    ...clinicUrls,
  ]
}

export async function sitemapIndexChunkIds(): Promise<number[]> {
  const count = await fetchSitemapClinicCount()
  const chunkCount = Math.max(1, Math.ceil(count / SITEMAP_CHUNK_SIZE))
  return Array.from({ length: chunkCount }, (_, index) => index)
}

export async function serveSitemapIndex(): Promise<Response> {
  const lastmod = new Date().toISOString().split('T')[0]
  try {
    const chunkIds = await sitemapIndexChunkIds()
    return xmlResponse(renderSitemapIndex(chunkIds, lastmod))
  } catch (error) {
    const message = error instanceof SitemapDataError ? error.message : 'Unexpected sitemap failure'
    console.error('[sitemap-index] failed:', message)
    return xmlResponse(renderSitemapIndex([0], lastmod))
  }
}

export async function serveSitemapChunk(idParam: string): Promise<Response> {
  const lastmod = new Date().toISOString().split('T')[0]
  if (!/^\d+$/.test(idParam)) {
    return xmlResponse(renderUrlset([], lastmod))
  }

  const chunkId = Number(idParam)
  try {
    const urls = await buildChunkUrls(chunkId)
    return xmlResponse(renderUrlset(urls, lastmod))
  } catch (error) {
    const message = error instanceof SitemapDataError ? error.message : 'Unexpected sitemap failure'
    console.error(`[sitemap] chunk ${chunkId} failed:`, message)
    const fallback = chunkId === 0 ? staticSitemapUrls() : []
    return xmlResponse(renderUrlset(fallback, lastmod))
  }
}
