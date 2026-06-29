# GR-SEO-RECOVERY — Convert clinic/city pages from force-dynamic → ISR + split sitemap

## ROOT CAUSE (confirmed from GSC data + git history)
GlowRoute SEO collapsed in two stages:
- **Apr 15 2026:** full 14k clinic dataset loaded at once → crawl pullback
- **May 28 2026:** commits `15c1ace` + `b2b8cea` added `export const dynamic = 'force-dynamic'` to clinic detail pages, city pages, and the sitemap (to fix SSG build timeouts with 15k clinics). This killed all static caching → uncached SSR on 15k pages → Googlebot crawl-budget collapse → impressions flatlined to near-zero through June.

GSC 3-month data: pre-crash peak ~11,644 impressions/day (Apr 2); post-May-28 near-zero. Pages ARE server-rendered correctly (no CSR problem) — the issue is purely `force-dynamic` defeating caching at 15k scale.

## OBJECTIVE
Replace `force-dynamic` with **ISR (Incremental Static Regeneration)** so top pages are pre-built + cached and the long tail is generated-then-cached on demand. Fix build timeout WITHOUT defeating crawl caching. Split the sitemap into a cached sitemap index.

## EXACT CHANGES

### 1. `app/clinics/[city]/[slug]/page.tsx`
- REMOVE: `export const dynamic = 'force-dynamic'` (line 1-2)
- ADD:
  ```ts
  export const revalidate = 86400        // 24h ISR cache
  export const dynamicParams = true      // long-tail generated on-demand then cached
  ```
- ADD `generateStaticParams()` that pre-renders ONLY the top performers from `top_clinic_urls.txt` (parse city+slug from each URL: `/clinics/{city}/{slug}`). Do NOT generate all 15k at build (that's the timeout). Return ~900 priority params. Example:
  ```ts
  export async function generateStaticParams() {
    // read top performers seed; return [{city, slug}, ...]
  }
  ```
  Seed list: `top_clinic_urls.txt` (942 URLs, repo root). Hardcode/import the parsed list — do not query Supabase at build (avoids timeout).

### 2. `app/clinics/[city]/page.tsx`
- REMOVE: `export const dynamic = 'force-dynamic'`
- ADD: `export const revalidate = 86400` + `export const dynamicParams = true`
- ADD `generateStaticParams()` returning the top ~40 cities from `top_cities.tsv` (column 3 = city slug).

### 3. `app/sitemap.ts`
- REMOVE: `export const dynamic = 'force-dynamic'`
- Convert to a **sitemap index** split into chunks ≤5,000 URLs. Implement Next.js `generateSitemaps()` returning chunk ids, with each chunk emitting its slice of clinic URLs. Add `export const revalidate = 86400` so it's cached, not rebuilt per-request.
- Keep all current URL categories (static, treatments, cities, clinics, claim top-200, articles, insights).

## SEED FILES (repo root)
- `top_cities.tsv` — cols: impressions, clicks, citySlug (40 rows)
- `top_clinic_urls.txt` — 942 full URLs of priority clinic pages

## CONSTRAINTS
- Next.js App Router (confirm version in package.json). Use the ISR pattern correct for that version (Next 14 vs 15: in 15, dynamicParams default differs; confirm).
- MUST build successfully (`npm run build` / `next build`) without timeout. Verify locally.
- Do NOT touch robots.txt (already correct: Allow /), do NOT change rendering logic/components, do NOT alter Supabase fetch functions beyond what generateStaticParams needs.
- Run `scripts/secret-scan.sh` equivalent / ensure no secrets in commits.

## DELIVERABLE
- Branch `fix/seo-isr-recovery`, commit, push, open PR to `main` with a description summarizing the root cause + fix. DO NOT merge — stage for Zion/Anthony review.
- Report: build result (pass/fail + build time), files changed, # static params generated, sitemap chunk count.

## VERIFICATION
- `next build` completes without the 15k timeout.
- Confirm top clinic + city pages emit as static/ISR (check `.next` build output: ● (SSG) or ISR, not ƒ (Dynamic)).
- Sitemap index resolves and chunks are valid XML structure.
