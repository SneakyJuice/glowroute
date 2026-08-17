// Sitemap index for robots.txt -> /sitemap.xml.
// Chunk URLs are dynamic route handlers, so the index cannot point at a
// build-time sitemap that disappears when clinic counts change.
import { SITE_URL } from '@/lib/config'
import { SITEMAP_CHUNK_SIZE, fetchSitemapClinicCount, SitemapDataError } from '@/lib/sitemap-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 15

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
}

function indexXml(chunkCount: number, lastmod: string): string {
  const entries = Array.from({ length: chunkCount }, (_, index) =>
    `  <sitemap>\n    <loc>${SITE_URL}/sitemap/${index}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`
}

export async function GET() {
  const lastmod = new Date().toISOString().split('T')[0]

  try {
    const count = await fetchSitemapClinicCount()
    const chunkCount = Math.max(1, Math.ceil(count / SITEMAP_CHUNK_SIZE))
    return new Response(indexXml(chunkCount, lastmod), { status: 200, headers: XML_HEADERS })
  } catch (error) {
    const message = error instanceof SitemapDataError ? error.message : 'Unexpected sitemap failure'
    console.error('[sitemap-index] failed:', message)
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
