import { fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'

/** Use the same publication checks and deterministic snapshot as the rendered directory. */
export const SITEMAP_CHUNK_SIZE = 5000
export type SitemapClinic = { id: string | number; slug: string; city: string }
export class SitemapDataError extends Error {
  constructor(message: string) { super(message); this.name = 'SitemapDataError' }
}
export function citySlug(city: string): string {
  return city.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}
async function publishedClinics() {
  return (await fetchAllClinicsFromSupabase()).filter(c => c.slug && c.city)
}
export async function fetchSitemapClinicCount(): Promise<number> {
  return (await publishedClinics()).length
}
export async function fetchSitemapClinicChunk(chunkIndex: number): Promise<SitemapClinic[]> {
  if (!Number.isSafeInteger(chunkIndex) || chunkIndex < 0) throw new SitemapDataError('Invalid sitemap chunk')
  return (await publishedClinics()).slice(chunkIndex * SITEMAP_CHUNK_SIZE, (chunkIndex + 1) * SITEMAP_CHUNK_SIZE)
    .map(({ id, slug, city }) => ({ id, slug, city }))
}
export async function fetchSitemapCities(): Promise<string[]> {
  return Array.from(new Set((await publishedClinics()).map(c => citySlug(c.city)))).filter(Boolean).sort()
}
