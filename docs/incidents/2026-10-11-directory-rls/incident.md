# Directory table access closed

Approved by Anthony. Jasmine signed off on the policies.

## What was open

From the time the six directory tables carried the default Supabase grants until 2026-10-11 15:29:46 EDT, `anon` and `authenticated` had full table privileges on:

- `public.clinics`
- `public.clinic_contacts`
- `public.reviews`
- `public.subscriptions`
- `public.treatments`
- `public.clinic_treatments`

Row level security was off, and there were no policies. The data in question is clinic directory rows and clinic contact notes.

The project was created on 2026-03-29. API and Postgres logs for 2026-04-13 through 2026-05-27 are not available. Queries for 2026-04-13, 2026-05-01, and 2026-05-27 returned no log rows. That unlogged period is part of the exposure window. Retained logs are present by 2026-07-15. 2026-07-01 still returned no rows.

## Scan

The contact-note scan covered 5,503 notes and recorded no sensitive data. The count and that result are kept in `log-stats.json`.

## Logs that are still available

Sampled retained days (2026-08-01, 2026-09-01, 2026-10-01, 2026-10-07, and 2026-10-09 through 2026-10-11) show no requests to `/rest/v1/clinic_contacts`. In the day around the apply, `/rest/v1/clinics` traffic was `service_role` only: 17,776 responses of 200 and 10 of 500 before the apply, and 6 responses of 200 after it. No `anon` role called that path in that day.

After the apply, `anon` has no SELECT privilege on `public.clinic_contacts`. A direct `anon` read returns `permission denied` (`42501`). `authenticated` is also denied. `service_role` still has SELECT.

## Fix

Applied `supabase/migrations/20261009130000_add_rls_policies.sql` to Supabase project `psiuknphchmhsthvhkpt` at 2026-10-11 15:29:46 EDT.

The migration enables row level security on the six tables, drops the broad grants, and leaves `anon` and `authenticated` with select access only to the public directory columns and rows. `clinic_contacts` and `subscriptions` have no policy for those roles. `service_role` keeps full table access.

The state captured before the apply is in `pre-apply-state.json`. The SQL that restores it is in `rollback.sql`. The SQL test output is in `test-output.txt`.

## Production check

After the apply, `https://glowroute.io` still returned 200 for `/`, `/clinics`, `/clinics/abilene`, a clinic profile, `/sitemap.xml`, `/sitemap/0.xml`, `/api/clinics`, `/claim`, and a clinic claim page. Incomplete claim, lead, and checkout posts were rejected by the existing validation. The directory was not rolled back.
