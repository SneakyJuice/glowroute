# GlowRoute quality and indexing audit
Date: November 12, 2026. Scope: production at glowroute.io; GitHub main at 47d63904d4f2543e2195161578d337f8ae8becda; Supabase psiuknphchmhsthvhkpt; Vercel project glowroute.

## Decision
Ship the tested directory/crawl repair, close the operational-view access gap, then revalidate source data before expanding the indexable directory. Google already indexes the homepage. The sampled directory, city, treatment, and profile URLs have poor indexing coverage despite successful fetches. Technical repairs can remove obstacles; indexing and rankings remain Google's decisions.

## What is live versus prepared
- Live configuration change: replaced Vercel's invalid public Supabase anon key with the project's existing public publishable key, verified by successful read-only directory requests. It applies to new builds in the existing production, preview, and development targets.
- Prepared code: branch codex/quality-indexing-repair. Website changes are not yet merged into main or deployed to production.
- Prepared database migration: 20261112000000_restrict_operational_views.sql. Not applied to production.
- No listing rows, ownership, subscriptions, or contacts were changed. No lead/claim forms were submitted. No outreach messages were sent.

## Priority findings
| Priority | Verified finding | Repair / remaining action |
| --- | --- | --- |
| P0 | Four operational views have anonymous SELECT permissions and run with owner privileges. outreach_ready includes contact names/emails/phones; clinic_signup_pipeline includes signup contact details. Underlying-table RLS does not fix those owner views. | Targeted permission migration prepared. Revoke public/anon/authenticated access, preserve service_role, and verify table and column privileges. No sensitive row values were downloaded to prove this. |
| P1 | Homepage HTML is 17,458,657 uncompressed bytes; /clinics is 17,428,635. Both embed the full directory and two competing initial render trees. | Server filtering/pagination, one SSR tree, 20-result pages, abortable requests, and crawlable pagination implemented. See final HTTP evidence for repaired size. |
| P1 | Live robots.txt disallows /_next/, which contains rendering resources. | Removed that restriction and the conflicting duplicate public robots file. /api remains disallowed. |
| P1 | Arbitrary city segments return the same profile with a false self-canonical, e.g. /clinics/not-the-city/belle-medical-miami-beach returns 200. Hidden records are not excluded by the privileged exact-slug lookup. | Visible-only lookup, conflict rejection, stored-city canonical paths and permanent redirects implemented. Cold redirects use dynamic rendering to avoid duplicate Location headers observed in local ISR checks. |
| P1 | 280 visible records have a postal-address state conflicting with their structured state. Belle Medical is labelled Miami Beach, FL but address, phone, website and coordinates identify Anchorage, AK. Its completeness score is 100 and needs_review is false. | Conflicting records are suppressed by the shared publication layer without inventing corrected locations. Sitemaps use that same pool. Source checks preserve discovery scope separately from source facts. Production row correction still needs source review. |
| P1 | glow_score is an integer field used both for scraped ratings and generated completeness scores. A quality job overwrites it, while the website labels it Google stars. 12,268 of 13,829 visible values are exactly 5. | Stop the quality job writing ratings. Suppress unsupported stars and rating filters until a dedicated, sourced decimal rating field is backfilled. This distribution alone does not prove every historical rating is fabricated. |
| P1 | Mobile filters open an empty box; phone and claim controls are white on transparent because legacy color tokens are undefined; tablet navigation overflows. | Shared filters, labels/state/focus, responsive navigation, token aliases and visible contact actions repaired and browser-tested. |
| P1 | Tiny logos, product images, unrelated landscapes and a tracking pixel are used as provider hero photos. | Bounded natural-size images, meaningful fallback/error states and tracking/credential/stock URL rejection implemented. Actual image relevance and permissions still need source validation. |
| P2 | A 90-point score displays components totalling 66 and a peptide component of 11/10. Directory counts claim verified providers although only one listing is verified. | Accurate four-bucket score breakdown and honest listing language implemented. Prices defaulting to $$ and unsupported feature filters removed. |
| P2 | Clear filters, radius text, city parsing, pagination and browser history disagree; city-hub handoffs silently broaden into radius searches. | Shared validated search state and server query implementation; exact-city handoffs retain scope when cleared. |
| P2 | Sitemap failures are returned as successful partial/empty 200 XML, invalid chunk IDs return 200, and lastmod changes every request regardless of content changes. | Failure responses use 503/no-store, invalid chunks use 404, and invented modification dates are omitted. |
| P2 | Staging serves a production clone without an exclusion directive. | Nonproduction hosts receive X-Robots-Tag: noindex, follow; production host handling is explicitly checked. |

Google currently processes only the first 2 MB of non-PDF resources, measured uncompressed. The oversized HTML and blocked rendering assets are concrete technical defects; the audit does not prove they alone caused all exclusions. [Googlebot limits](https://developers.google.com/search/docs/crawling-indexing/googlebot), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Search Console evidence
Property: sc-domain:glowroute.io. Owner access was available. URL Inspection is Google's cached index state, not a live fetch test.

| URL | Index status reported November 12 | Recorded last crawl |
| --- | --- | --- |
| / | Submitted and indexed; indexing allowed; fetch successful | July 30, 2026 |
| /clinics | Crawled, currently not indexed; fetch successful; robots allowed | March 31, 2026 |
| /clinics/miami | Crawled, currently not indexed; fetch successful; robots allowed | March 29, 2026 |
| /clinics/miami-beach/belle-medical-miami-beach | Crawled, currently not indexed; fetch successful; robots allowed | March 31, 2026 |
| /treatments/botox-fillers | Crawled, currently not indexed; fetch successful; robots allowed | March 29, 2026 |
| /guides/botox-cost | Unknown to Google | None reported |
| /clinics/miami/miami-plastic-surgery-miami | Unknown to Google | None reported |

Performance: August 12–November 9 inclusive, 90 days: 59 impressions and zero clicks. October 12–November 9: 26 impressions, zero clicks, with the homepage the only page returned in the page-level report. These are first-party observations, not estimated traffic. Missing performance rows do not establish a full index count.

The sitemap index was last downloaded November 7 and reports zero processing errors/warnings. It is already submitted. Repeated submission alone is not the repair. Staging is outside the verified domain property, so its URL Inspection request could not be evaluated.

## Supabase quality baseline
All counts below were read from the production database; metadata-estimated table sizes were not used as exact row counts.

| Measure | Count / scope |
| --- | --- |
| Total listings | 15,814 |
| Visible listings | 13,829 |
| Verified / claimed | 1 / 0 across all listings |
| Flagged for review | 0 across all listings |
| Visible records missing a description | 4,467 |
| Visible records missing services | 6,156 |
| Missing coordinates | 1,564 across all listings |
| Visible postal-state conflicts | 280 |
| Florida-tagged visible coordinates outside a broad Florida rectangle | 245 review candidates, not independently confirmed errors |
| Same normalized name/address among visible listings | 948 candidate groups, 1,208 extra rows; not automatically safe to merge |
| Visible descriptions containing Markdown link syntax | 707 |
| Visible hero URLs naming logos / stock hosts / credential query strings | 233 / 23 / 1 |

The repaired publication pool excludes the 280 postal-state conflicts, yielding 13,549 records before city/slug requirements. Presence of a URL or phone is not proof of accuracy. needs_review and data_quality_score currently do not provide an accuracy guarantee.

Known recurrence mechanisms:
- WF-06 stamps the requested search city/state onto every Apify result. The repair keeps actual source location and discovery scope separate.
- The scorer can overwrite ratings, promote review states, and run live by default. The repair stops rating writes, preserves review states and defaults to reporting.
- Tampa intake can overwrite existing ownership/moderation flags during merge upsert. The repair uses insert-only conflict handling.
- expand03 intake drops upstream review flags. The repair retains or recomputes quarantine status.
Other legacy import/backfill jobs still require consolidation into one reviewed intake path. No paid Apify/Firecrawl bulk job was run.

## Code and deployment assessment
The project uses Next.js 15.5.28, React 19.2.9 and Supabase. Vercel's active production deployment is READY and matches GitHub main, deployed October 22. No deployment protection was found on production. The custom domain and www domain are verified; www redirects to the apex successfully.

Useful existing foundations include a narrow public directory column projection, RLS on the ten public base tables, a composite directory ordering index, deterministic keyset pagination, cached directory reads, and a recent framework security upgrade. The public-view grants bypass part of that access design and need the separate migration.

The original 41 tests passed despite visible product failures. The repair adds behavior coverage, a pull-request quality workflow, and a modern eslint command. Lint passes with zero errors but retains a substantial warning backlog; this is not a clean-code certification. Billing, payment webhooks, lead delivery, full authentication flows and every administrative job were not exhaustively audited.

## Visual QA and acceptance
Three agents independently reviewed desktop navigation/search, six listing profiles with sampled primary-source checks, and mobile/tablet layouts. Real tested widths include 320, 390, 768 and approximately 1036 pixels. No forms were submitted.

Verified local changes:
- Miami 25-mile results: 965; Botox: 273; clearing restores 965.
- Exact Miami city handoff: 136; Botox: 52; clearing restores 136 without broadening distance.
- Tampa 5-mile search: 83; pagination remains bounded and browser Back restores the original page.
- St. Petersburg hub resolves and renders 18 listings.
- The mobile filter panel exposes actual controls; phone/claim actions are readable.
- Tablet document width 753 px at a 768 px viewport.
- SkinLocal's 199×36 logo remains at natural dimensions; score 70 equals 20+35+15+0.
- Image content can still be wrong even when its dimensions and display are correct.

Validation: 72 unit/regression tests pass; TypeScript and optimized production build pass; ESLint has zero errors with a warning backlog. Final production HTML is 176,699 bytes, down 98.99% from 17,458,657, with one H1 and 20 real server-rendered profile actions. The API returns 20 results in 28,503 bytes. HTTP assertions pass for 308 redirects, conflict 404s, sitemap chunks, rendering-resource access, and indexable production versus excluded staging hosts. Evidence is in the workspace audit directory: local-production-evidence.json and production-build.log.

## Durable recovery work
1. Roll out the reviewed repair and operational-view permissions migration. Verify production CSS/JS crawl access, final HTML size, 308/404 behavior, sitemap URLs, public permissions and mobile contact flow.
2. Reconcile the 280 hard location conflicts, 948 duplicate candidates and image-source problems against Google Place IDs and official provider pages. Keep raw input, source URL, retrieval time, entity match confidence, review owner and reasons for each accepted fact. Do not replace real locations with search scope.
3. Add a separate decimal Google rating field with source identity, review count and retrieval time. Backfill from reviewed source matches. Re-enable stars only after validation.
4. Select a small initial group of complete city hubs and accurate profiles. Add useful local comparison details, source dates, qualification evidence where available, and relevant internal links. Do not generate thousands of interchangeable pages to compensate for missing facts.
5. Review treatment/health claims with appropriate expertise and primary sources. An unsupported February 2026 FDA reclassification claim and blanket verification claims were removed from the active peptide page. Older generated medical pages and treatment tables still need review. [FDA compounding information](https://www.fda.gov/drugs/human-drug-compounding/understanding-risks-compounded-drugs).
6. Publish actual Privacy and Terms documents appropriate to the business and its lead/analytics practices. Dead placeholder links were removed; policy content was not invented.
7. After deployment, inspect representative URLs in Search Console, check Google's recorded recrawl dates and compare indexed coverage, impressions and clicks over time. A submitted sitemap does not guarantee indexing. [Google indexing FAQ](https://developers.google.com/search/help/crawling-index-faq).

Radius centers currently use the median of matching-city coordinates, not an authoritative geocoder. Same-named cities need explicit state disambiguation. A source-and-review data model is needed for a durable directory, beyond this repair batch.

## Evidence and coverage limits
Artifacts in ../audit: http-evidence.json, connected-evidence.json, visual-directory.md, visual-listings.md, visual-mobile.md, screenshots/, tests.log, lint.json, production-build.log, and local-production-evidence.json. Direct source URLs and reproductions are in the visual reports.

GitHub and Vercel connectors and the connected Supabase/Search Console tools were used. The OpenSEO connector was not available in the tool catalog; no paid ranking, keyword-demand or backlink estimates were invented. Search-result absence was not treated as proof of non-indexing. Runtime error logs had no matches in the available recent 30-minute window; that is not a historical reliability assessment.

This audit establishes verified defects and a tested repair. It does not certify every provider, guarantee indexing, or claim production rollout has happened.

## Publication and checks

The repair is published for review in [draft PR #37](https://github.com/SneakyJuice/glowroute/pull/37). Its first GitHub Directory quality run passed. Vercel requires a GitHub-verified commit before building; retain that protection and confirm the latest preview and CI checks before merging. The application tree matches the locally tested repair. Production rollout and the database migration remain separate steps.

Release acceptance requires a successful preview build and the production HTTP checks recorded above before merging into main.
