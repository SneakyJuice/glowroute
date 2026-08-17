// Sitemap index for robots.txt → /sitemap.xml.
// generateSitemaps() emits /sitemap/{id}.xml; this route lists those chunks.
// Uses a COUNT query only — never loads clinic rows.
export const revalidate = 86400
export const runtime = 'nodejs'
export const maxDuration = 15

import { SITE_URL } from '@/lib/config'
import { SITEMAP_CHUNK_SIZE, fetchSitemapClinicCount } from '@/lib/sitemap-data'

function indexXml(chunkCount: number, lastmod: string): string {
  const entries = Array.from({ length: chunkCount }, (_, i) =>
    `  <sitemap>\n    <loc>${SITE_URL}/sitemap/${i}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`
}

export async function GET() {
  const lastmod = new Date().toISOString().split('T')[0]

  try {
    const count = await fetchSitemapClinicCount()
    const chunkCount = Math.max(1, Math.ceil(count / SITEMAP_CHUNK_SIZE))
    return new Response(indexXml(chunkCount, lastmod), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[sitemap-index] failed:', err)
    return new Response(indexXml(1, lastmod), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=60',
      },
    })
  }
}
