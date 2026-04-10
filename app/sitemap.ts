import type { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://glowroute.io'
  const now = new Date()

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/clinics`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ]

  // SEO treatment city pages
  let seoRoutes: MetadataRoute.Sitemap = []
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'seo-pages-manifest.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    seoRoutes = manifest.map((p: { path: string }) => ({
      url: `${base}${p.path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch { /* manifest not found */ }

  return [...staticRoutes, ...seoRoutes]
}
