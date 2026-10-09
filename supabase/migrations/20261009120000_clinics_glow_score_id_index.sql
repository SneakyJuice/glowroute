-- Directory reads order by glow_score DESC NULLS LAST, then id.
-- glow_score is nullable, so the index includes NULLS LAST.
--
-- This index is already applied in production as idx_clinics_glow_score_nl_id.
-- The statement below matches that definition. IF NOT EXISTS makes a second
-- run a no-op when the index is already present.
--
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- Apply this file on its own, outside a transaction:
-- the Supabase SQL editor, or psql with no surrounding BEGIN/COMMIT.
-- `supabase db push` and other migration runners that wrap each file
-- in a transaction will reject this statement until it is run that way.

create index concurrently if not exists idx_clinics_glow_score_nl_id
  on public.clinics (glow_score desc nulls last, id);
