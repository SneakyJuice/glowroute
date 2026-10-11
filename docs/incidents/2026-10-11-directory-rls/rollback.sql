-- Rollback for supabase/migrations/20261009130000_add_rls_policies.sql
--
-- Restores the production state captured on 2026-10-11 before that
-- migration was applied to Supabase project psiuknphchmhsthvhkpt.
-- Snapshot: docs/incidents/2026-10-11-directory-rls/pre-apply-state.json
--
-- Captured state:
--   clinics, clinic_contacts, reviews, subscriptions, treatments,
--   clinic_treatments
--   row level security disabled and not forced
--   no policies
--   anon, authenticated, and service_role each had table-level
--   DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, and UPDATE
--
-- Run as postgres. This does not delete rows.

drop policy if exists clinics_public_select on public.clinics;
drop policy if exists reviews_public_select on public.reviews;
drop policy if exists treatments_public_select on public.treatments;
drop policy if exists clinic_treatments_public_select on public.clinic_treatments;

revoke all on table public.clinics from PUBLIC, anon, authenticated;
revoke all on table public.clinic_contacts from PUBLIC, anon, authenticated;
revoke all on table public.reviews from PUBLIC, anon, authenticated;
revoke all on table public.subscriptions from PUBLIC, anon, authenticated;
revoke all on table public.treatments from PUBLIC, anon, authenticated;
revoke all on table public.clinic_treatments from PUBLIC, anon, authenticated;

grant all on table public.clinics to anon, authenticated, service_role;
grant all on table public.clinic_contacts to anon, authenticated, service_role;
grant all on table public.reviews to anon, authenticated, service_role;
grant all on table public.subscriptions to anon, authenticated, service_role;
grant all on table public.treatments to anon, authenticated, service_role;
grant all on table public.clinic_treatments to anon, authenticated, service_role;

alter table public.clinics disable row level security;
alter table public.clinic_contacts disable row level security;
alter table public.reviews disable row level security;
alter table public.subscriptions disable row level security;
alter table public.treatments disable row level security;
alter table public.clinic_treatments disable row level security;
