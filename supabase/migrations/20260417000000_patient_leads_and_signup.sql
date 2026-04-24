-- =============================================================================
-- GlowRoute — Migration: patient_leads + clinic_signups
-- GR Sprint: Quiz Backend (WF-08 prereq) + WF-03 Clinic Signup Processing
-- Created: 2026-04-17
-- =============================================================================

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- =============================================================================
-- TABLE: patient_leads
-- Quiz-sourced patient leads. Captures quiz answers, matched clinic, and
-- downstream routing status. Powers WF-08 quiz router (n8n).
-- =============================================================================

CREATE TABLE IF NOT EXISTS patient_leads (
    id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ── Contact Info ──────────────────────────────────────────────────────
    first_name              text,
    last_name               text,
    email                   text        NOT NULL,
    phone                   text,
    zip                     text,
    state                   text,
    city                    text,

    -- ── Quiz Answers ──────────────────────────────────────────────────────
    -- Primary concern selected in quiz (e.g. "skin texture", "volume loss")
    primary_concern         text,
    -- Array of concerns if multi-select allowed
    concerns                text[]      DEFAULT '{}',
    -- Budget range (e.g. "under_500", "500_1500", "1500_plus")
    budget_range            text        CHECK (budget_range IN (
                                            'under_500', '500_1500', '1500_3000', '3000_plus', 'not_sure'
                                        )),
    -- Timeline for treatment (e.g. "asap", "1_3_months", "3_6_months", "just_browsing")
    timeline                text        CHECK (timeline IN (
                                            'asap', '1_3_months', '3_6_months', 'just_browsing'
                                        )),
    -- Prior treatments (has the patient had similar treatments before?)
    prior_treatments        boolean,
    -- Free-text from quiz (any additional notes patient adds)
    quiz_notes              text,
    -- Raw quiz answers as JSON (future-proof for schema changes)
    quiz_payload            jsonb       DEFAULT '{}',

    -- ── Treatment Matching ────────────────────────────────────────────────
    -- Recommended treatments from quiz logic (e.g. ["botox", "rf-microneedling"])
    recommended_treatments  text[]      DEFAULT '{}',
    -- Match score 0.0–1.0 for how well the quiz result fits the matched clinic
    match_score             float4,

    -- ── Clinic Routing ────────────────────────────────────────────────────
    -- The clinic this lead was routed to (nullable until matched)
    routed_clinic_id        uuid        REFERENCES clinics(id) ON DELETE SET NULL,
    -- Fallback: clinic slug string if ID match fails
    routed_clinic_slug      text,
    -- How the routing decision was made
    routing_method          text        CHECK (routing_method IN (
                                            'geo_match', 'treatment_match', 'manual', 'fallback'
                                        )),
    -- Timestamp routing occurred
    routed_at               timestamptz,

    -- ── Pipeline Status ───────────────────────────────────────────────────
    status                  text        NOT NULL DEFAULT 'new'
                                CHECK (status IN (
                                    'new',          -- just submitted
                                    'routed',       -- assigned to a clinic
                                    'notified',     -- clinic has been notified
                                    'contacted',    -- clinic contacted the patient
                                    'converted',    -- consultation booked / converted
                                    'lost',         -- no response / dropped out
                                    'disqualified'  -- spam, test, or out of area
                                )),

    -- ── Acquisition / Attribution ─────────────────────────────────────────
    -- Entry point (e.g. "homepage_quiz", "city_page_quiz", "blog_cta")
    source                  text        NOT NULL DEFAULT 'quiz',
    -- UTM params for ad attribution
    utm_source              text,
    utm_medium              text,
    utm_campaign            text,
    utm_content             text,
    -- Landing page URL the quiz was on
    entry_url               text,
    -- Referrer
    referrer                text,

    -- ── Compliance & Consent ──────────────────────────────────────────────
    -- Patient explicitly consented to being contacted
    consent_to_contact      boolean     NOT NULL DEFAULT false,
    -- Patient consented to GlowRoute privacy policy
    consent_privacy         boolean     NOT NULL DEFAULT false,
    -- IP address at time of submission (for TCPA/compliance logging)
    submission_ip           text,
    -- User-agent string
    user_agent              text,

    -- ── Internal Ops ──────────────────────────────────────────────────────
    -- n8n workflow execution ID (WF-08) for traceability
    wf08_execution_id       text,
    -- Any routing errors or notes from WF-08
    routing_notes           text,
    -- Admin-only notes
    internal_notes          text,

    -- ── Timestamps ────────────────────────────────────────────────────────
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE patient_leads IS
  'Quiz-sourced patient leads. Each row is one quiz submission, enriched with '
  'routing data and pipeline status. Powers WF-08 (quiz router) and WF-02 (outreach).';

COMMENT ON COLUMN patient_leads.quiz_payload IS
  'Raw JSON of all quiz answers — future-proof storage in case question schema changes.';
COMMENT ON COLUMN patient_leads.recommended_treatments IS
  'Treatment slugs recommended by quiz logic (matches treatments.slug).';
COMMENT ON COLUMN patient_leads.match_score IS
  'Geo + treatment match confidence for routed_clinic_id. 0.0 = no match, 1.0 = perfect.';
COMMENT ON COLUMN patient_leads.routing_method IS
  'How the clinic was selected: geo_match (closest) | treatment_match (best service fit) | manual | fallback (any active clinic in state).';
COMMENT ON COLUMN patient_leads.wf08_execution_id IS
  'n8n workflow execution ID for WF-08 — enables tracing a lead through the routing pipeline.';

-- Auto-update updated_at
CREATE TRIGGER patient_leads_updated_at
    BEFORE UPDATE ON patient_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- TABLE: clinic_signups
-- WF-03: Tracks clinic onboarding requests from the glowroute.io signup form.
-- Separate from clinic_claims (claims = existing listing; signups = net new).
-- =============================================================================

CREATE TABLE IF NOT EXISTS clinic_signups (
    id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ── Submitter Info ────────────────────────────────────────────────────
    contact_name            text        NOT NULL,
    contact_email           text        NOT NULL,
    contact_phone           text,
    contact_title           text,       -- e.g. "Owner", "Practice Manager"

    -- ── Clinic Info ───────────────────────────────────────────────────────
    clinic_name             text        NOT NULL,
    clinic_website          text,
    clinic_phone            text,
    clinic_address          text,
    clinic_city             text,
    clinic_state            text,
    clinic_zip              text,

    -- ── Interest ──────────────────────────────────────────────────────────
    -- Tier they expressed interest in at signup
    interested_tier         text        CHECK (interested_tier IN ('free', 'starter', 'pro', 'elite')),
    -- Services they offer (from multi-select on form)
    services_offered        text[]      DEFAULT '{}',
    -- How they heard about GlowRoute
    referral_source         text,
    -- Any message/questions from the form
    message                 text,

    -- ── Processing Status ─────────────────────────────────────────────────
    status                  text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                    'pending',      -- submitted, not yet reviewed
                                    'in_review',    -- being processed
                                    'approved',     -- clinic created + invited
                                    'rejected',     -- declined (spam, duplicate, OOA)
                                    'duplicate'     -- matched to existing clinic record
                                )),

    -- ── Linked Records ────────────────────────────────────────────────────
    -- If approved, the clinic record that was created/linked
    linked_clinic_id        uuid        REFERENCES clinics(id) ON DELETE SET NULL,
    -- If duplicate, the existing clinic this matched
    duplicate_clinic_id     uuid        REFERENCES clinics(id) ON DELETE SET NULL,

    -- ── Automation ────────────────────────────────────────────────────────
    -- n8n WF-03 execution ID for processing traceability
    wf03_execution_id       text,
    -- HubSpot company ID if synced
    hubspot_company_id      text,
    -- Welcome email sent timestamp
    welcome_email_sent_at   timestamptz,
    -- Internal review notes
    review_notes            text,

    -- ── Attribution ───────────────────────────────────────────────────────
    utm_source              text,
    utm_medium              text,
    utm_campaign            text,
    entry_url               text,
    submission_ip           text,

    -- ── Timestamps ────────────────────────────────────────────────────────
    submitted_at            timestamptz NOT NULL DEFAULT now(),
    reviewed_at             timestamptz,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE clinic_signups IS
  'Net-new clinic onboarding requests from glowroute.io signup form. '
  'Processed by WF-03 (n8n). Distinct from clinic_claims (which are for existing listings).';

COMMENT ON COLUMN clinic_signups.status IS
  'Processing pipeline: pending → in_review → approved (clinic record created) | rejected | duplicate.';

CREATE TRIGGER clinic_signups_updated_at
    BEFORE UPDATE ON clinic_signups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- INDEXES
-- =============================================================================

-- patient_leads
CREATE INDEX IF NOT EXISTS idx_patient_leads_email          ON patient_leads(email);
CREATE INDEX IF NOT EXISTS idx_patient_leads_status         ON patient_leads(status);
CREATE INDEX IF NOT EXISTS idx_patient_leads_routed_clinic  ON patient_leads(routed_clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_leads_created_at     ON patient_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_leads_state          ON patient_leads(state);
CREATE INDEX IF NOT EXISTS idx_patient_leads_zip            ON patient_leads(zip);
CREATE INDEX IF NOT EXISTS idx_patient_leads_source         ON patient_leads(source);
-- GIN index for treatment array search
CREATE INDEX IF NOT EXISTS idx_patient_leads_treatments     ON patient_leads USING gin(recommended_treatments);
CREATE INDEX IF NOT EXISTS idx_patient_leads_concerns       ON patient_leads USING gin(concerns);

-- clinic_signups
CREATE INDEX IF NOT EXISTS idx_clinic_signups_email         ON clinic_signups(contact_email);
CREATE INDEX IF NOT EXISTS idx_clinic_signups_status        ON clinic_signups(status);
CREATE INDEX IF NOT EXISTS idx_clinic_signups_clinic_name   ON clinic_signups USING gin(clinic_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clinic_signups_submitted_at  ON clinic_signups(submitted_at DESC);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- patient_leads: public insert (quiz form), service role for reads/updates
ALTER TABLE patient_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_leads_public_insert
    ON patient_leads FOR INSERT
    WITH CHECK (true);

-- Clinic owners can see leads routed to their clinic
CREATE POLICY patient_leads_clinic_owner_select
    ON patient_leads FOR SELECT
    USING (
        routed_clinic_id IN (
            SELECT clinic_id FROM clinic_claims
            WHERE user_id = auth.uid() AND status = 'approved'
        )
    );

-- clinic_signups: public insert, service role for all operations
ALTER TABLE clinic_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinic_signups_public_insert
    ON clinic_signups FOR INSERT
    WITH CHECK (true);

-- Only service role can read/update clinic_signups (internal ops via WF-03)
-- No SELECT policy for normal auth users — admin/service role only


-- =============================================================================
-- VIEW: patient_lead_routing_summary
-- Quick overview of routing health — used in GlowRoute Ops reporting
-- =============================================================================

CREATE OR REPLACE VIEW patient_lead_routing_summary AS
SELECT
    status,
    routing_method,
    COUNT(*)                                        AS lead_count,
    ROUND(AVG(match_score)::numeric, 3)            AS avg_match_score,
    COUNT(*) FILTER (WHERE routed_clinic_id IS NULL) AS unrouted_count,
    MIN(created_at)                                 AS oldest_lead,
    MAX(created_at)                                 AS newest_lead
FROM patient_leads
GROUP BY status, routing_method
ORDER BY lead_count DESC;

COMMENT ON VIEW patient_lead_routing_summary IS
  'Routing health dashboard for patient leads — grouped by status and routing method.';


-- =============================================================================
-- VIEW: clinic_signup_pipeline
-- WF-03 processing queue view
-- =============================================================================

CREATE OR REPLACE VIEW clinic_signup_pipeline AS
SELECT
    cs.id,
    cs.clinic_name,
    cs.clinic_city,
    cs.clinic_state,
    cs.contact_name,
    cs.contact_email,
    cs.interested_tier,
    cs.status,
    cs.submitted_at,
    cs.reviewed_at,
    cs.linked_clinic_id,
    c.slug                                          AS linked_clinic_slug,
    c.is_claimed                                    AS clinic_is_claimed
FROM clinic_signups cs
LEFT JOIN clinics c ON c.id = cs.linked_clinic_id
ORDER BY cs.submitted_at DESC;

COMMENT ON VIEW clinic_signup_pipeline IS
  'WF-03 processing queue — shows all clinic signups with linked clinic status.';


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
