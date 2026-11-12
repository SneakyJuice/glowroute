-- Alias infrastructure only. No clinic rows are suppressed by this migration.
-- Deploy alias-aware lookup before applying the separately reviewed suppression batch.
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.clinic_duplicate_runs (
  run_id text PRIMARY KEY CHECK (btrim(run_id) <> ''),
  rule_version text NOT NULL,
  status text NOT NULL DEFAULT 'prepared'
    CHECK (status IN ('prepared', 'applied', 'rolled_back', 'rollback_partial')),
  expected_rows integer NOT NULL CHECK (expected_rows >= 0),
  affected_rows integer NOT NULL DEFAULT 0 CHECK (affected_rows >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  rolled_back_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.clinic_aliases (
  alias_slug text PRIMARY KEY CHECK (btrim(alias_slug) <> '' AND alias_slug !~ '^/'),
  canonical_clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  alias_city_slug text NOT NULL CHECK (btrim(alias_city_slug) <> ''),
  source_clinic_id uuid NOT NULL UNIQUE REFERENCES public.clinics(id) ON DELETE RESTRICT,
  run_id text NOT NULL REFERENCES private.clinic_duplicate_runs(run_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_clinic_id <> canonical_clinic_id)
);
CREATE INDEX IF NOT EXISTS clinic_aliases_canonical_clinic_id_idx
  ON public.clinic_aliases(canonical_clinic_id);

CREATE TABLE IF NOT EXISTS private.clinic_duplicate_audit (
  run_id text NOT NULL REFERENCES private.clinic_duplicate_runs(run_id) ON DELETE RESTRICT,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  canonical_clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  alias_slug text NOT NULL,
  alias_city_slug text NOT NULL,
  confidence_rule text NOT NULL,
  identity_hash text NOT NULL,
  before_values jsonb NOT NULL,
  after_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  rolled_back_at timestamptz,
  PRIMARY KEY (run_id, clinic_id),
  CHECK (
    jsonb_typeof(before_values) = 'object'
    AND before_values - ARRAY['id','visibility','needs_review','review_reason','updated_at']::text[] = '{}'::jsonb
  ),
  CHECK (
    after_values IS NULL OR (
      jsonb_typeof(after_values) = 'object'
      AND after_values - ARRAY['id','visibility','needs_review','review_reason','updated_at']::text[] = '{}'::jsonb
    )
  )
);

ALTER TABLE public.clinic_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.clinic_duplicate_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.clinic_duplicate_audit ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.clinic_aliases FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES (
  alias_slug, canonical_clinic_id, alias_city_slug, source_clinic_id, run_id, created_at
) ON TABLE public.clinic_aliases FROM PUBLIC, anon, authenticated;
GRANT SELECT (alias_slug, canonical_clinic_id, alias_city_slug)
  ON TABLE public.clinic_aliases TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinic_aliases TO service_role;

DROP POLICY IF EXISTS clinic_aliases_public_visible_target ON public.clinic_aliases;
CREATE POLICY clinic_aliases_public_visible_target
  ON public.clinic_aliases
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinics canonical
      WHERE canonical.id = canonical_clinic_id AND canonical.visibility = 'visible'
    )
  );

REVOKE ALL PRIVILEGES ON TABLE private.clinic_duplicate_runs, private.clinic_duplicate_audit
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE private.clinic_duplicate_runs, private.clinic_duplicate_audit
  TO service_role;

COMMENT ON TABLE public.clinic_aliases IS
  'Public-safe historical clinic slugs. Resolve the visible canonical record before redirecting; no clinic deletion or foreign-key retargeting.';
COMMENT ON TABLE private.clinic_duplicate_audit IS
  'Reversible visibility-only changes. Backup JSON is restricted to id, visibility, needs_review, review_reason, updated_at; never contact or lead payloads.';

COMMIT;
