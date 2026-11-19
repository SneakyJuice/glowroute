import { NextRequest } from 'next/server'
import { serveSitemapChunk } from '@/lib/sitemap-build'
import { skipUnreachableDatabasePrerender } from '@/lib/skip-build-prerender'

export const runtime = 'nodejs'
export const revalidate = 86400
export const maxDuration = 30

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    return await serveSitemapChunk(id)
  } catch (error) {
    skipUnreachableDatabasePrerender()
    throw error
  }
}
