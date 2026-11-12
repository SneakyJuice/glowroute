-- Run after the matching migration. Metadata only, no contact or lead values.
select c.relname,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_select,
  has_any_column_privilege('anon', c.oid, 'SELECT') as anon_any_column_select,
  has_any_column_privilege('authenticated', c.oid, 'SELECT') as authenticated_any_column_select,
  has_table_privilege('service_role', c.oid, 'SELECT') as service_select,
  c.reloptions
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in (
  'outreach_ready','clinic_signup_pipeline','patient_lead_routing_summary',
  'contact_coverage_by_state','clinic_ratings'
);
