-- Keep unattended scoring/import jobs from republishing reviewed quarantines.
-- Restore an alias source by removing its alias first; restore other quarantines
-- only through a reviewed transaction that clears its hold and sets
-- SET LOCAL glowroute.reviewed_publication = 'on'.
BEGIN;

CREATE OR REPLACE FUNCTION private.guard_clinic_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.visibility = 'visible' AND (
    EXISTS (SELECT 1 FROM public.clinic_aliases a WHERE a.source_clinic_id = NEW.id)
    OR (coalesce(NEW.needs_review, false)
        AND coalesce(NEW.review_reason, '') ~ '^(duplicate:|postal-state-20261112-v1:)')
  ) THEN
    RAISE EXCEPTION 'Listing is quarantined; resolve its review or alias before publication'
      USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.visibility = 'visible' THEN
    IF coalesce(OLD.review_reason, '') ~ '^(duplicate:|postal-state-20261112-v1:)'
       AND coalesce(current_setting('glowroute.reviewed_publication', true), '') <> 'on' THEN
      RAISE EXCEPTION 'Reviewed publication transaction required to restore a quarantined listing'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_clinic_publication() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS clinic_publication_guard ON public.clinics;
CREATE TRIGGER clinic_publication_guard
BEFORE INSERT OR UPDATE OF visibility, needs_review, review_reason ON public.clinics
FOR EACH ROW EXECUTE FUNCTION private.guard_clinic_publication();

COMMIT;
