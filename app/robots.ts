import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Google needs the Next.js scripts, styles and image optimizer to render pages.
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
