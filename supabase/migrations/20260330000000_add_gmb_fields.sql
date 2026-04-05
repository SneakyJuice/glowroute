-- Migration: Add GMB enrichment fields to clinics table
-- Added: 2026-03-30 as part of T-11/T-GMB enrichment pipeline

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS place_id TEXT,
  ADD COLUMN IF NOT EXISTS gmb_enriched_at TIMESTAMPTZ;

-- Index for finding unenriched clinics
CREATE INDEX IF NOT EXISTS idx_clinics_place_id ON clinics(place_id) WHERE place_id IS NOT NULL;

COMMENT ON COLUMN clinics.review_count IS 'Google Maps review count from GMB enrichment';
COMMENT ON COLUMN clinics.place_id IS 'Google Maps Place ID from Apify enrichment';
COMMENT ON COLUMN clinics.glow_score IS 'Google Maps rating (0-5) from GMB enrichment or user reviews';
COMMENT ON COLUMN clinics.gmb_enriched_at IS 'Timestamp of last Google Maps Business enrichment';
