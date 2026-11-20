/** Pages that stay live (200) but must not be indexed or listed in sitemaps. */

export const NOINDEX_FOLLOW_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
} as const

export const PAUSED_INDEX_PATHS = [
  '/articles/peptide-reference-guide',
  '/articles/bpc-157-guide',
  '/articles/compounded-semaglutide-fda',
  '/articles/14-peptides-update',
  '/articles/compounded-semaglutide-ending-2026',
  '/articles/peptides-mainstream-npr-politico',
  '/articles/miami-4beauty-peptide-compliance',
  '/articles/batch-006-01-fda-peptide-reclassification',
  '/articles/batch-006-08-peptide-reactivation',
  '/treatments/weight-loss-ozempic',
  '/treatments/peptide-therapy',
  '/guides/semaglutide-ozempic-cost',
  '/guides/peptide-therapy-cost',
] as const

const PAUSED_INDEX_PATH_SET = new Set<string>(PAUSED_INDEX_PATHS)

export function isPausedIndexPath(pathname: string): boolean {
  return PAUSED_INDEX_PATH_SET.has(pathname)
}

/** Claim URLs and the pause list are omitted from every sitemap. */
export function isExcludedSitemapPath(pathname: string): boolean {
  const path = pathname.startsWith('http') ? new URL(pathname).pathname : pathname
  if (path === '/claim' || path.startsWith('/claim/')) return true
  return isPausedIndexPath(path)
}
