-- Operational views currently bypass the underlying RLS as their owner and
-- have anonymous SELECT grants. Preserve service access; do not change rows.
begin;
revoke all on public.outreach_ready from PUBLIC, anon, authenticated;
revoke all on public.clinic_signup_pipeline from PUBLIC, anon, authenticated;
revoke all on public.patient_lead_routing_summary from PUBLIC, anon, authenticated;
revoke all on public.contact_coverage_by_state from PUBLIC, anon, authenticated;
grant select on public.outreach_ready, public.clinic_signup_pipeline,
  public.patient_lead_routing_summary, public.contact_coverage_by_state to service_role;
-- Approved public reviews must still respect the visibility of their clinic.
-- RLS already restricts public reviews to approved rows; the view also reads this flag.
grant select (is_approved) on public.reviews to anon, authenticated;
alter view public.clinic_ratings set (security_invoker = true);
commit;
