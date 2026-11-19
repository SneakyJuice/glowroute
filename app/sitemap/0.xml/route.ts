// Static /sitemap/0.xml — same folder-name pattern as /sitemap.xml.
// Next.js does not treat app/sitemap/[id].xml as /sitemap/0.xml (brackets
// must wrap the entire segment), which is why the previous child 404ed.
import { serveSitemapChunk } from '@/lib/sitemap-build'
import { skipUnreachableDatabasePrerender } from '@/lib/skip-build-prerender'

export const runtime = 'nodejs'
export const revalidate = 86400
export const maxDuration = 30

export async function GET() {
  try {
    return await serveSitemapChunk('0')
  } catch (error) {
    skipUnreachableDatabasePrerender()
    throw error
  }
}
