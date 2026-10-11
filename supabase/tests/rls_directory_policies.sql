-- Run after supabase/migrations/20261009130000_add_rls_policies.sql.
-- The row-filter section inserts sample rows inside a transaction and rolls
-- them back. Nothing else in this file writes rows.
--
-- SQL editor (as postgres), or:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_directory_policies.sql
--
-- The login role must be able to SET ROLE anon, authenticated, and service_role.
-- A failing check raises an exception. Success prints:
--   NOTICE: rls directory checks passed

-- Column limits below are the database GRANTs from the migration.
-- The checks SET ROLE and select those columns directly.

create or replace function pg_temp.assert_closed_table(role_name text, table_name text)
returns void
language plpgsql
as $$
declare
  row_count bigint := null;
begin
  if has_table_privilege(role_name, format('public.%I', table_name), 'SELECT') then
    -- Privilege catalog says SELECT is still granted. A read must then
    -- return no rows. Any other result fails this check.
    begin
      execute format('set local role %I', role_name);
      execute format('select count(*) from public.%I', table_name) into row_count;
      raise exception 'probe_count:%', row_count;
    exception
      when insufficient_privilege then
        if sqlerrm ilike '%set role%' then
          raise;
        end if;
        raise notice '% on public.%: permission denied', role_name, table_name;
        return;
      when raise_exception then
        if sqlerrm !~ '^probe_count:' then
          raise;
        end if;
        row_count := split_part(sqlerrm, ':', 2)::bigint;
    end;
  else
    begin
      execute format('set local role %I', role_name);
      execute format('select count(*) from public.%I', table_name) into row_count;
      raise exception 'probe_count:%', coalesce(row_count, 0);
    exception
      when insufficient_privilege then
        if sqlerrm ilike '%set role%' then
          raise;
        end if;
        raise notice '% on public.%: permission denied', role_name, table_name;
        return;
      when raise_exception then
        if sqlerrm !~ '^probe_count:' then
          raise;
        end if;
        row_count := split_part(sqlerrm, ':', 2)::bigint;
    end;
  end if;

  if row_count is null or row_count <> 0 then
    raise exception '% read % rows from public.%', role_name, row_count, table_name;
  end if;
  raise notice '% on public.%: 0 rows', role_name, table_name;
end;
$$;

create or replace function pg_temp.assert_column_denied(role_name text, denied_column text)
returns void
language plpgsql
as $$
begin
  if not exists (
    select 1
    from information_schema.columns as c
    where c.table_schema = 'public'
      and c.table_name = 'clinics'
      and c.column_name = denied_column
  ) then
    raise exception 'clinics.% does not exist', denied_column;
  end if;

  if has_column_privilege(role_name, 'public.clinics'::regclass, denied_column, 'SELECT') then
    raise exception '% still has SELECT on clinics.%', role_name, denied_column;
  end if;

  begin
    execute format('set local role %I', role_name);
    execute format('select %I from public.clinics limit 0', denied_column);
    raise exception 'column_readable';
  exception
    when insufficient_privilege then
      if sqlerrm ilike '%set role%' then
        raise;
      end if;
    when raise_exception then
      if sqlerrm = 'column_readable' then
        raise exception '% read clinics.%', role_name, denied_column;
      end if;
      raise;
  end;

  raise notice '% clinics.%: permission denied', role_name, denied_column;
end;
$$;

create or replace function pg_temp.assert_granted_clinic_columns(role_name text)
returns void
language plpgsql
as $$
declare
  column_name text;
  granted_columns text[] := array[
    'id',
    'slug',
    'name',
    'description',
    'address',
    'city',
    'state',
    'lat',
    'lng',
    'phone',
    'website',
    'instagram_handle',
    'hero_image_url',
    'logo_url',
    'is_verified',
    'is_claimed',
    'is_featured',
    'review_count',
    'glow_score',
    'goals',
    'services',
    'visibility'
  ];
begin
  for column_name in
    select c.column_name
    from information_schema.columns as c
    where c.table_schema = 'public'
      and c.table_name = 'clinics'
    order by c.ordinal_position
  loop
    if column_name = any (granted_columns) then
      if not has_column_privilege(role_name, 'public.clinics'::regclass, column_name, 'SELECT') then
        raise exception '% is missing SELECT on granted clinics.%', role_name, column_name;
      end if;
    else
      perform pg_temp.assert_column_denied(role_name, column_name);
    end if;
  end loop;

  begin
    execute format('set local role %I', role_name);
    execute $q$
      select
        id, slug, name, description, address, city, state, lat, lng,
        phone, website, instagram_handle, hero_image_url, logo_url,
        is_verified, is_claimed, is_featured, review_count, glow_score,
        goals, services, visibility
      from public.clinics
      limit 0
    $q$;
    raise exception 'granted_ok';
  exception
    when insufficient_privilege then
      raise exception '% could not read granted clinics columns: %', role_name, sqlerrm;
    when raise_exception then
      if sqlerrm is distinct from 'granted_ok' then
        raise;
      end if;
  end;

  begin
    execute format('set local role %I', role_name);
    execute 'select * from public.clinics limit 0';
    raise exception 'wildcard_readable';
  exception
    when insufficient_privilege then
      if sqlerrm ilike '%set role%' then
        raise;
      end if;
    when raise_exception then
      if sqlerrm = 'wildcard_readable' then
        raise exception '% wildcard select on clinics succeeded', role_name;
      end if;
      raise;
  end;

  raise notice '% granted clinics columns are readable; wildcard select is denied', role_name;
end;
$$;

-- These columns are not in the clinics GRANT. Fail if the table is missing one.
select pg_temp.assert_column_denied('anon', 'email');
select pg_temp.assert_column_denied('authenticated', 'email');
select pg_temp.assert_column_denied('anon', 'contact_email');
select pg_temp.assert_column_denied('authenticated', 'contact_email');
select pg_temp.assert_column_denied('anon', 'stripe_customer_id');
select pg_temp.assert_column_denied('authenticated', 'stripe_customer_id');
select pg_temp.assert_column_denied('anon', 'subscription_id');
select pg_temp.assert_column_denied('authenticated', 'subscription_id');
select pg_temp.assert_column_denied('anon', 'claim_tier');
select pg_temp.assert_column_denied('authenticated', 'claim_tier');
select pg_temp.assert_column_denied('anon', 'plan');
select pg_temp.assert_column_denied('authenticated', 'plan');
select pg_temp.assert_column_denied('anon', 'place_id');
select pg_temp.assert_column_denied('authenticated', 'place_id');

select pg_temp.assert_closed_table('anon', 'clinic_contacts');
select pg_temp.assert_closed_table('authenticated', 'clinic_contacts');
select pg_temp.assert_closed_table('anon', 'subscriptions');
select pg_temp.assert_closed_table('authenticated', 'subscriptions');

select pg_temp.assert_granted_clinic_columns('anon');
select pg_temp.assert_granted_clinic_columns('authenticated');

-- Row filters: anon counts must match the service_role counts of the rows
-- the policies allow. Sample rows are inserted only inside this transaction.
begin;

do $row_filters$
declare
  visible_id uuid;
  hidden_id uuid;
  treatment_id uuid;
  service_clinics_all bigint;
  service_clinics_visible bigint;
  anon_clinics bigint;
  service_reviews_all bigint;
  service_reviews_visible bigint;
  anon_reviews bigint;
  service_links_all bigint;
  service_links_visible bigint;
  anon_links bigint;
begin
  insert into public.clinics (slug, name, visibility)
  values ('rls-check-visible-' || gen_random_uuid()::text, 'RLS Check Visible', 'visible')
  returning id into visible_id;

  insert into public.clinics (slug, name, visibility)
  values ('rls-check-hidden-' || gen_random_uuid()::text, 'RLS Check Hidden', 'hidden')
  returning id into hidden_id;

  insert into public.treatments (name, slug, category)
  values (
    'RLS Check Treatment ' || gen_random_uuid()::text,
    'rls-check-treatment-' || gen_random_uuid()::text,
    'wellness'
  )
  returning id into treatment_id;

  insert into public.reviews (clinic_id, reviewer_name, rating, body, is_approved)
  values
    (visible_id, 'RLS Check', 5, 'approved on a visible clinic', true),
    (visible_id, 'RLS Check', 4, 'not approved', false),
    (hidden_id, 'RLS Check', 5, 'approved on a hidden clinic', true);

  insert into public.clinic_treatments (clinic_id, treatment_id)
  values
    (visible_id, treatment_id),
    (hidden_id, treatment_id);

  execute 'set local role service_role';
  select count(id) into service_clinics_all from public.clinics;
  select count(id) into service_clinics_visible
    from public.clinics
    where visibility = 'visible';
  select count(id) into service_reviews_all from public.reviews;
  select count(r.id) into service_reviews_visible
    from public.reviews as r
    join public.clinics as c on c.id = r.clinic_id
    where r.is_approved = true
      and c.visibility = 'visible';
  select count(clinic_id) into service_links_all from public.clinic_treatments;
  select count(ct.clinic_id) into service_links_visible
    from public.clinic_treatments as ct
    join public.clinics as c on c.id = ct.clinic_id
    where c.visibility = 'visible';

  if service_clinics_all <= service_clinics_visible
     or service_reviews_all <= service_reviews_visible
     or service_links_all <= service_links_visible then
    raise exception 'row filter fixture was not visible to service_role';
  end if;

  execute 'set local role anon';
  select count(id) into anon_clinics from public.clinics;
  select count(id) into anon_reviews from public.reviews;
  select count(clinic_id) into anon_links from public.clinic_treatments;

  if anon_clinics <> service_clinics_visible then
    raise exception 'anon clinic count % does not match service_role visible count %',
      anon_clinics, service_clinics_visible;
  end if;
  if anon_reviews <> service_reviews_visible then
    raise exception 'anon review count % does not match service_role approved-on-visible count %',
      anon_reviews, service_reviews_visible;
  end if;
  if anon_links <> service_links_visible then
    raise exception 'anon clinic_treatments count % does not match service_role visible-clinic count %',
      anon_links, service_links_visible;
  end if;

  raise exception 'row_filters_rollback';
exception
  when raise_exception then
    if sqlerrm is distinct from 'row_filters_rollback' then
      raise;
    end if;
    raise notice 'anon row filters match service_role counts';
end
$row_filters$;

rollback;

do $$
begin
  if not has_table_privilege('service_role', 'public.clinic_contacts', 'SELECT')
     or not has_table_privilege('service_role', 'public.subscriptions', 'SELECT')
     or not has_column_privilege('service_role', 'public.clinics'::regclass, 'email', 'SELECT') then
    raise exception 'service_role table access changed';
  end if;
  raise notice 'rls directory checks passed';
end;
$$;
