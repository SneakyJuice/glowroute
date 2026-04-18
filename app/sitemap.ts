import { MetadataRoute } from 'next'
import { fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'
import { TREATMENTS, TREATMENT_SLUGS } from '@/lib/treatments'
import { SITE_URL } from '@/lib/config'
import { ARTICLES } from '@/data/articles'
import { INSIGHTS } from '@/data/insights'

function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const clinics = await fetchAllClinicsFromSupabase()
  const today = new Date().toISOString().split('T')[0]

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                    lastModified: today, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/clinics`,       lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/treatments`,    lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/articles`,      lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/insights`,      lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/claim`,         lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/specialties`,   lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/quiz`,          lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/telehealth`,    lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
  ]

  // ── Treatment pages ───────────────────────────────────────────────────────
  const treatmentPages: MetadataRoute.Sitemap = TREATMENT_SLUGS.map(slug => ({
    url: `${SITE_URL}/treatments/${slug}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  // ── City landing pages ────────────────────────────────────────────────────
  const uniqueCities = Array.from(new Set(clinics.map(c => citySlug(c.city)))).filter(Boolean)
  const cityPages: MetadataRoute.Sitemap = uniqueCities.map(city => ({
    url: `${SITE_URL}/clinics/${city}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── City × Treatment combo pages (high SEO value) ────────────────────────
  // e.g. /clinics/tampa/botox-fillers — build only combos that have ≥1 clinic
  const cityTreatmentSet = new Set<string>()
  for (const clinic of clinics) {
    const cSlug = citySlug(clinic.city)
    const allTreatments = [...(clinic.treatments || []), ...(clinic.specialtyTreatments || [])]
    for (const treatment of TREATMENTS) {
      // Match if any clinic treatment contains the treatment keyword
      const keywords = treatment.name.toLowerCase().split(/[&,\/\s]+/).filter(k => k.length > 3)
      const hasMatch = allTreatments.some(t => 
        keywords.some(kw => t.toLowerCase().includes(kw))
      ) || treatment.slug === 'botox-fillers' // botox is common enough to include all cities
      if (hasMatch) {
        cityTreatmentSet.add(`${cSlug}/${treatment.slug}`)
      }
    }
  }

  const cityTreatmentPages: MetadataRoute.Sitemap = Array.from(cityTreatmentSet).map(combo => ({
    url: `${SITE_URL}/clinics/${combo}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  // ── Clinic profiles ───────────────────────────────────────────────────────
  const clinicPages: MetadataRoute.Sitemap = clinics.map(c => ({
    url: `${SITE_URL}/clinics/${citySlug(c.city)}/${c.slug}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: c.featured ? 0.8 : 0.7,
  }))

  // ── Claim pages (all clinics — 24/7 sales machine) ────────────────────────
  const claimPages: MetadataRoute.Sitemap = clinics.map(c => ({
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

  const all = [
    ...staticPages,
    ...treatmentPages,
    ...cityPages,
    ...cityTreatmentPages,
    ...clinicPages,
    ...claimPages,
    ...articlePages,
    ...insightPages,
  ]

  console.log(`[sitemap] Generated ${all.length} URLs — ${clinicPages.length} clinics, ${cityTreatmentPages.length} city×treatment, ${cityPages.length} cities`)

  return all
}
