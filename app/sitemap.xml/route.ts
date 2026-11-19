// Sitemap index for robots.txt -> /sitemap.xml.
// Child URLs are registered as /sitemap/{n}.xml (static 0.xml + rewrite for n>0).
import { serveSitemapIndex } from '@/lib/sitemap-build'
import { skipUnreachableDatabasePrerender } from '@/lib/skip-build-prerender'

export const runtime = 'nodejs'
export const revalidate = 86400
export const maxDuration = 30

export async function GET() {
  try {
    return await serveSitemapIndex()
  } catch (error) {
    skipUnreachableDatabasePrerender()
    throw error
  }
}
