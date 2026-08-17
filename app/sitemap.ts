export const revalidate = 86400
export const runtime = 'nodejs'
export const maxDuration = 30

import { MetadataRoute } from 'next'
import { TREATMENT_SLUGS } from '@/lib/treatments'
import { SITE_URL } from '@/lib/config'
import { ARTICLES } from '@/data/articles'
import { INSIGHTS } from '@/data/insights'
import {
  SITEMAP_CHUNK_SIZE,
  citySlug,
  fetchSitemapCities,
  fetchSitemapClinicChunk,
  fetchSitemapClinicCount,
  fetchTopClaimSlugs,
} from '@/lib/sitemap-data'

export async function generateSitemaps() {
  try {
    const totalUrls = await fetchSitemapClinicCount()
    const chunkCount = Math.max(1, Math.ceil(totalUrls / SITEMAP_CHUNK_SIZE))
    return Array.from({ length: chunkCount }, (_, i) => ({ id: i }))
  } catch (err) {
    console.error('[sitemap] generateSitemaps failed:', err)
    return [{ id: 0 }]
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().split('T')[0]
  const chunkId = Number.isFinite(id) ? id : 0

  try {
    if (chunkId === 0) {
      const [cities, claimSlugs, clinicSlice] = await Promise.all([
        fetchSitemapCities(),
        fetchTopClaimSlugs(200),
        fetchSitemapClinicChunk(0),
      ])

      const staticPages: MetadataRoute.Sitemap = [
        { url: SITE_URL, lastModified: today, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${SITE_URL}/clinics`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
        { url: `${SITE_URL}/claim`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${SITE_URL}/treatments`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/articles`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/insights`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/specialties`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${SITE_URL}/quiz`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${SITE_URL}/telehealth`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
      ]

      const treatmentPages: MetadataRoute.Sitemap = TREATMENT_SLUGS.map((slug) => ({
        url: `${SITE_URL}/treatments/${slug}`,
        lastModified: today,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

      const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
        url: `${SITE_URL}/clinics/${city}`,
        lastModified: today,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

      const claimPages: MetadataRoute.Sitemap = claimSlugs.map((slug) => ({
        url: `${SITE_URL}/claim/${slug}`,
        lastModified: today,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))

      const articlePages: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
        url: `${SITE_URL}/articles/${a.slug}`,
        lastModified: a.publishedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))

      const insightPages: MetadataRoute.Sitemap = INSIGHTS.map((i) => ({
        url: `${SITE_URL}/insights/${i.slug}`,
        lastModified: i.publishedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      }))

      const clinicPages: MetadataRoute.Sitemap = clinicSlice.map((c) => ({
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
        ...clinicPages,
      ]
    }

    const clinicSlice = await fetchSitemapClinicChunk(chunkId)
    return clinicSlice.map((c) => ({
      url: `${SITE_URL}/clinics/${citySlug(c.city)}/${c.slug}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (err) {
    console.error('[sitemap] chunk', chunkId, 'failed:', err)
    if (chunkId === 0) {
      return [{ url: SITE_URL, lastModified: today, changeFrequency: 'weekly', priority: 1.0 }]
    }
    return []
  }
}
