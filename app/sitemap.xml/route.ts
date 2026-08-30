// Sitemap index for robots.txt -> /sitemap.xml.
// Child URLs are registered as /sitemap/{n}.xml (static 0.xml + rewrite for n>0).
import { serveSitemapIndex } from '@/lib/sitemap-build'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 15

export async function GET() {
  return serveSitemapIndex()
}
