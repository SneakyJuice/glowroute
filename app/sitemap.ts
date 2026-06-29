// ISR: sitemap rebuilt every 24h, not on every request
export const revalidate = 86400

import { MetadataRoute } from 'next'
import { allClinics } from '@/data/all-clinics'
import { TREATMENT_SLUGS } from '@/lib/treatments'
import { SITE_URL } from '@/lib/config'
import { ARTICLES } from '@/data/articles'
import { INSIGHTS } from '@/data/insights'

function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** Maximum URLs per sitemap chunk (Google limit: 50,000; we use 5,000 for safety) */
const CHUNK_SIZE = 5000

/** Return chunk ids so Next.js generates /sitemap/0.xml, /sitemap/1.xml, etc. */
export async function generateSitemaps() {
  const clinics = await allClinics
  const totalUrls = clinics.length
  const chunkCount = Math.max(1, Math.ceil(totalUrls / CHUNK_SIZE))
  return Array.from({ length: chunkCount }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const clinics = await allClinics
  const today = new Date().toISOString().split('T')[0]

  // Chunk 0 carries all non-clinic URLs + first slice of clinic profiles
  if (id === 0) {
    // ── Static pages ────────────────────────────────────────────────────────
    const staticPages: MetadataRoute.Sitemap = [
      { url: SITE_URL,               lastModified: today, changeFrequency: 'weekly',  priority: 1.0 },
      { url: `${SITE_URL}/clinics`,  lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
      { url: `${SITE_URL}/claim`,    lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${SITE_URL}/treatments`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${SITE_URL}/articles`, lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${SITE_URL}/insights`, lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${SITE_URL}/specialties`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${SITE_URL}/quiz`,       lastModified: today, changeFrequency: 'weekly',  priority: 0.9 },
      { url: `${SITE_URL}/telehealth`, lastModified: today, changeFrequency: 'weekly',  priority: 0.9 },
    ]

    // ── Treatment pages ──────────────────────────────────────────────────────
    const treatmentPages: MetadataRoute.Sitemap = TREATMENT_SLUGS.map(slug => ({
      url: `${SITE_URL}/treatments/${slug}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // ── City landing pages ───────────────────────────────────────────────────
    const uniqueCities = Array.from(new Set(clinics.map(c => citySlug(c.city))))
    const cityPages: MetadataRoute.Sitemap = uniqueCities.map(city => ({
      url: `${SITE_URL}/clinics/${city}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // ── Claim pages (top 200 pre-rendered) ────────────────────────────────────
    const claimPages: MetadataRoute.Sitemap = clinics.slice(0, 200).map(c => ({
      url: `${SITE_URL}/claim/${c.slug}`,
      lastModified: today,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))

    // ── Article pages ────────────────────────────────────────────────────────
    const articlePages: MetadataRoute.Sitemap = ARTICLES.map(a => ({
      url: `${SITE_URL}/articles/${a.slug}`,
      lastModified: a.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // ── Insight pages ────────────────────────────────────────────────────────
    const insightPages: MetadataRoute.Sitemap = INSIGHTS.map(i => ({
      url: `${SITE_URL}/insights/${i.slug}`,
      lastModified: i.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }))

    // ── Clinic profiles: first chunk ────────────────────────────────────────
    const clinicSlice = clinics.slice(0, CHUNK_SIZE).map(c => ({
      url: `${SITE_URL}/clinics/${citySlug(c.city)}/${c.slug}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [
      ...staticPages,
      ...treatmentPages,
      ...cityPages,
      ...claimPages,
      ...articlePages,
      ...insightPages,
      ...clinicSlice,
    ]
  }

  // ── Subsequent chunks: clinic profiles only ──────────────────────────────
  const start = id * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, clinics.length)
  return clinics.slice(start, end).map(c => ({
    url: `${SITE_URL}/clinics/${citySlug(c.city)}/${c.slug}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
}
