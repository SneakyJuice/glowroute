import { NextRequest } from 'next/server'
import { serveSitemapChunk } from '@/lib/sitemap-build'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return serveSitemapChunk(params.id)
}
