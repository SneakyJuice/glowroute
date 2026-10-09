-- Directory reads order by glow_score, then id.
--
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- Apply this file on its own, outside a transaction:
-- the Supabase SQL editor, or psql with no surrounding BEGIN/COMMIT.
-- `supabase db push` and other migration runners that wrap each file
-- in a transaction will reject this statement until it is run that way.

create index concurrently if not exists idx_clinics_glow_score_id on public.clinics (glow_score desc, id);
