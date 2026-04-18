# GlowRoute Leads Database

## Overview
This directory contains raw and deduplicated clinic leads for GlowRoute's Revenue Ops funnel.

## Files
- `raw/` — Raw scraped data with timestamps (preserved for audit)
- `master-leads.json` — Deduplicated master list of all unique clinic leads

## Schema
Each lead object in `master-leads.json` contains:
```json
{
  "clinic_name": "string",
  "website_url": "string (unique key)",
  "phone": "string|null",
  "email": "string|null", 
  "city": "string",
  "state": "string",
  "zip": "string|null",
  "services_offered": "string[]",
  "social_links": "string[]",
  "scraped_at": "ISO timestamp",
  "source_city": "string",
  "source_state": "string"
}
```

## Pipeline
1. **WF-06** — Clinic scraping (Firecrawl) → `raw/{timestamp}.json`
2. **Deduplication** — Against `master-leads.json` by `website_url`
3. **Enrichment** — WF-07 (Apollo) adds contact info, firmographics
4. **Scoring** — WF-08 (tier scoring) → outreach priority