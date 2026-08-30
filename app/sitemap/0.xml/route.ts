// Static /sitemap/0.xml — same folder-name pattern as /sitemap.xml.
// Next.js does not treat app/sitemap/[id].xml as /sitemap/0.xml (brackets
// must wrap the entire segment), which is why the previous child 404ed.
import { serveSitemapChunk } from '@/lib/sitemap-build'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

export async function GET() {
  return serveSitemapChunk('0')
}
