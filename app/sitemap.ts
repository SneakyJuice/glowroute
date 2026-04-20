import { MetadataRoute } from 'next'
import { allClinics } from '@/data/all-clinics'
import { TREATMENT_SLUGS } from '@/lib/treatments'
import { SITE_URL } from '@/lib/config'
import { ARTICLES } from '@/data/articles'
import { INSIGHTS } from '@/data/insights'

function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const clinics = await allClinics
  const today = new Date().toISOString().split('T')[0]

  // ── Static pages ──────────────────────────────────────────────────────────
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

  // ── Treatment pages ───────────────────────────────────────────────────────
  const treatmentPages: MetadataRoute.Sitemap = TREATMENT_SLUGS.map(slug => ({
    url: `${SITE_URL}/treatments/${slug}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── City landing pages ────────────────────────────────────────────────────
  const uniqueCities = Array.from(new Set(clinics.map(c => citySlug(c.city))))
  const cityPages: MetadataRoute.Sitemap = uniqueCities.map(city => ({
    url: `${SITE_URL}/clinics/${city}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Clinic profiles ───────────────────────────────────────────────────────
  const clinicPages: MetadataRoute.Sitemap = clinics.map(c => ({
    url: `${SITE_URL}/clinics/${citySlug(c.city)}/${c.slug}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ── Claim pages (top 200 pre-rendered) ────────────────────────────────────
  const claimPages: MetadataRoute.Sitemap = clinics.slice(0, 200).map(c => ({
    url: `${SITE_URL}/claim/${c.slug}`,
    lastModified: today,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // ── Article pages ─────────────────────────────────────────────────────────
  const articlePages: MetadataRoute.Sitemap = ARTICLES.map(a => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: a.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // ── Insight pages ─────────────────────────────────────────────────────────
  const insightPages: MetadataRoute.Sitemap = INSIGHTS.map(i => ({
    url: `${SITE_URL}/insights/${i.slug}`,
    lastModified: i.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }))

  return [
    ...staticPages,
    ...treatmentPages,
    ...cityPages,
    ...clinicPages,
    ...claimPages,
    ...articlePages,
    ...insightPages,
  ]
}