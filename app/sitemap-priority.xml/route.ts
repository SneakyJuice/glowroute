import { SITE_URL } from '@/lib/config'
import { renderUrlset, xmlResponse } from '@/lib/sitemap-build'

export const dynamic = 'force-dynamic'

/** A small cohort for Search Console recovery checks, separate from all known URLs. */
export async function GET() {
  return xmlResponse(renderUrlset([
    SITE_URL,
    `${SITE_URL}/clinics`,
    `${SITE_URL}/clinics/miami`,
    `${SITE_URL}/clinics/tampa`,
    `${SITE_URL}/clinics/miami/skinlocal-dadeland-miami`,
    `${SITE_URL}/claim`,
  ]))
}
