-- Add RLS policies on the directory tables.
--
-- anon and authenticated may SELECT the public directory columns.
-- They have no write policies. service_role is granted full table access
-- and bypasses row level security.
--
-- anon and authenticated must name columns on clinics, reviews, and
-- clinic_treatments. A wildcard select is not available to those roles
-- on those tables. Those limits are column-level GRANTs on the tables.
--
-- After applying this file, run supabase/tests/rls_directory_policies.sql.

alter table public.clinics enable row level security;
alter table public.clinic_contacts enable row level security;
alter table public.reviews enable row level security;
alter table public.subscriptions enable row level security;
alter table public.treatments enable row level security;
alter table public.clinic_treatments enable row level security;

-- clinics: visible directory rows, columns the public pages render.
revoke all on table public.clinics from PUBLIC, anon, authenticated;
grant select (
  id,
  slug,
  name,
  description,
  address,
  city,
  state,
  lat,
  lng,
  phone,
  website,
  instagram_handle,
  hero_image_url,
  logo_url,
  is_verified,
  is_claimed,
  is_featured,
  review_count,
  glow_score,
  goals,
  services,
  visibility
) on table public.clinics to anon, authenticated;
grant all on table public.clinics to service_role;

drop policy if exists clinics_public_select on public.clinics;
create policy clinics_public_select
  on public.clinics
  for select
  to anon, authenticated
  using (visibility = 'visible');

-- clinic_contacts: no anon or authenticated access.
revoke all on table public.clinic_contacts from PUBLIC, anon, authenticated;
grant all on table public.clinic_contacts to service_role;

-- reviews: approved reviews for visible clinics, without the account id.
revoke all on table public.reviews from PUBLIC, anon, authenticated;
grant select (
  id,
  clinic_id,
  reviewer_name,
  rating,
  body,
  created_at
) on table public.reviews to anon, authenticated;
grant all on table public.reviews to service_role;

drop policy if exists reviews_public_select on public.reviews;
create policy reviews_public_select
  on public.reviews
  for select
  to anon, authenticated
  using (
    is_approved = true
    and exists (
      select 1
      from public.clinics
      where clinics.id = reviews.clinic_id
        and clinics.visibility = 'visible'
    )
  );

-- subscriptions: no anon or authenticated access.
revoke all on table public.subscriptions from PUBLIC, anon, authenticated;
grant all on table public.subscriptions to service_role;

-- treatments: public catalog. Every column is display data.
revoke all on table public.treatments from PUBLIC, anon, authenticated;
grant select on table public.treatments to anon, authenticated;
grant all on table public.treatments to service_role;

drop policy if exists treatments_public_select on public.treatments;
create policy treatments_public_select
  on public.treatments
  for select
  to anon, authenticated
  using (true);

-- clinic_treatments: links for visible clinics only.
revoke all on table public.clinic_treatments from PUBLIC, anon, authenticated;
grant select (clinic_id, treatment_id) on table public.clinic_treatments to anon, authenticated;
grant all on table public.clinic_treatments to service_role;

drop policy if exists clinic_treatments_public_select on public.clinic_treatments;
create policy clinic_treatments_public_select
  on public.clinic_treatments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.clinics
      where clinics.id = clinic_treatments.clinic_id
        and clinics.visibility = 'visible'
    )
  );
