-- GlowRoute Migration: Add contact enrichment + data quality columns
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- Created: 2026-04-05

-- Contact enrichment columns (from Apollo.io T-11)
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS contact_name       TEXT,
  ADD COLUMN IF NOT EXISTS contact_email      TEXT,
  ADD COLUMN IF NOT EXISTS contact_title      TEXT,
  ADD COLUMN IF NOT EXISTS contact_linkedin   TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone      TEXT,
  ADD COLUMN IF NOT EXISTS apollo_enriched_at TIMESTAMPTZ;

-- Data quality flag columns (for 710 clinics missing images + other review needs)
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS needs_review       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS review_reason      TEXT,      -- e.g. 'missing_image', 'no_website', 'low_data'
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER;  -- 0-100, computed from completeness

-- Index for fast flag queries
CREATE INDEX IF NOT EXISTS idx_clinics_needs_review ON clinics(needs_review) WHERE needs_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_clinics_contact_email ON clinics(contact_email) WHERE contact_email IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clinics'
  AND column_name IN ('contact_name','contact_email','contact_title','contact_linkedin','contact_phone','apollo_enriched_at','needs_review','review_reason','data_quality_score')
ORDER BY column_name;
