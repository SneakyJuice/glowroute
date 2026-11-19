import { unstable_noStore } from 'next/cache'

/**
 * A production build must not fail, and must not store an empty page, when
 * the database cannot be read. Opting out of static generation during the
 * build leaves the route to render on the next request. At runtime this is a
 * no-op so a thrown data error can keep the last good ISR entry.
 */
export function skipUnreachableDatabasePrerender(): void {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    unstable_noStore()
  }
}
