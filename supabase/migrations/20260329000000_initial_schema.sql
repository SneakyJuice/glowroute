-- =============================================================================
-- GlowRoute — Supabase Database Schema
-- "The Leafly of MedSpas" — Florida Market Launch
-- Migration: 001_initial_schema
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search on clinic names

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- clinics — core listing table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinics (
    id                  uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                text            NOT NULL UNIQUE,
    name                text            NOT NULL,
    description         text,

    -- Location
    address             text,
    city                text,
    state               text,
    zip                 text,
    lat                 float8,
    lng                 float8,

    -- Contact
    phone               text,
    email               text,
    website             text,

    -- Social
    instagram_handle    text,
    facebook_url        text,

    -- Media
    hero_image_url      text,
    logo_url            text,

    -- Status flags
    is_verified         boolean         NOT NULL DEFAULT false,
    is_claimed          boolean         NOT NULL DEFAULT false,
    is_featured         boolean         NOT NULL DEFAULT false,

    -- Tier & status
    claim_tier          text            NOT NULL DEFAULT 'free'
                            CHECK (claim_tier IN ('free', 'starter', 'pro', 'elite')),
    status              text            NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('active', 'pending', 'inactive')),

    -- Timestamps
    created_at          timestamptz     NOT NULL DEFAULT now(),
    updated_at          timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE clinics IS 'Core medspa and wellness clinic listings directory.';
COMMENT ON COLUMN clinics.slug IS 'URL-friendly unique identifier, e.g. glow-spa-tampa';
COMMENT ON COLUMN clinics.claim_tier IS 'Subscription tier: free | starter | pro | elite';
COMMENT ON COLUMN clinics.is_featured IS 'Promoted/featured placement in directory listings';

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clinics_updated_at
    BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- treatments — service categories / treatment tags
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatments (
    id          uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        text    NOT NULL UNIQUE,
    slug        text    NOT NULL UNIQUE,
    category    text    NOT NULL,   -- e.g. injectables, body-contouring, skin, wellness
    icon_name   text                -- icon identifier for UI (e.g. "syringe", "snowflake")
);

COMMENT ON TABLE treatments IS 'Master list of medspa treatment types used as searchable tags.';
COMMENT ON COLUMN treatments.category IS 'Treatment group: injectables | body-contouring | skin | wellness | weight-loss';


-- -----------------------------------------------------------------------------
-- clinic_treatments — many-to-many join: clinics <-> treatments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinic_treatments (
    clinic_id       uuid    NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    treatment_id    uuid    NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    PRIMARY KEY (clinic_id, treatment_id)
);

COMMENT ON TABLE clinic_treatments IS 'Associates clinics with the treatments they offer.';


-- -----------------------------------------------------------------------------
-- reviews — user reviews of clinics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id       uuid        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL, -- nullable: allows anonymous
    reviewer_name   text,       -- displayed name for anonymous or named reviews
    rating          int2        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body            text,
    is_approved     boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE reviews IS 'Clinic reviews submitted by users or anonymous visitors.';
COMMENT ON COLUMN reviews.user_id IS 'NULL for anonymous reviews; linked to auth.users when authenticated.';
COMMENT ON COLUMN reviews.is_approved IS 'Moderation flag — only approved reviews surface in public listings.';


-- -----------------------------------------------------------------------------
-- leads — lead capture: consultation requests, contact forms
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id           uuid        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Contact info
    first_name          text,
    last_name           text,
    email               text,
    phone               text,

    -- Intent
    treatment_interest  text,
    message             text,

    -- Acquisition
    source              text        NOT NULL DEFAULT 'directory'
                            CHECK (source IN ('directory', 'featured', 'ad')),

    -- Pipeline status
    status              text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'contacted', 'converted', 'lost')),

    created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE leads IS 'Inbound leads from directory, featured placements, and paid ads.';
COMMENT ON COLUMN leads.source IS 'Lead acquisition channel: directory | featured | ad';
COMMENT ON COLUMN leads.status IS 'CRM pipeline stage: new | contacted | converted | lost';


-- -----------------------------------------------------------------------------
-- clinic_claims — clinic owner claiming their listing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinic_claims (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id       uuid        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at    timestamptz NOT NULL DEFAULT now(),
    reviewed_at     timestamptz,
    notes           text        -- internal admin notes on claim decision
);

COMMENT ON TABLE clinic_claims IS 'Tracks clinic owner claim requests and approval workflow.';


-- -----------------------------------------------------------------------------
-- subscriptions — clinic SaaS billing (Stripe-backed)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id               uuid        NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
    tier                    text        NOT NULL
                                CHECK (tier IN ('starter', 'pro', 'elite')),

    -- Stripe identifiers
    stripe_customer_id      text,
    stripe_subscription_id  text,

    -- Billing status
    status                  text        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'past_due', 'canceled')),

    -- Billing period
    current_period_start    timestamptz,
    current_period_end      timestamptz,

    created_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE subscriptions IS 'SaaS subscription records per clinic, synced from Stripe webhooks.';
COMMENT ON COLUMN subscriptions.tier IS 'Billing tier: starter ($299/mo) | pro ($499/mo) | elite ($799/mo)';


-- =============================================================================
-- INDEXES
-- =============================================================================

-- Clinic search & filtering
CREATE INDEX IF NOT EXISTS idx_clinics_city        ON clinics(city);
CREATE INDEX IF NOT EXISTS idx_clinics_state       ON clinics(state);
CREATE INDEX IF NOT EXISTS idx_clinics_status      ON clinics(status);
CREATE INDEX IF NOT EXISTS idx_clinics_is_featured ON clinics(is_featured);
CREATE INDEX IF NOT EXISTS idx_clinics_slug        ON clinics(slug);

-- Geo search support (PostGIS-friendly, or manual bounding box)
CREATE INDEX IF NOT EXISTS idx_clinics_lat_lng     ON clinics(lat, lng);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_id   ON reviews(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(clinic_id, is_approved);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_clinic_id     ON leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads(status);

-- Fuzzy search on clinic name
CREATE INDEX IF NOT EXISTS idx_clinics_name_trgm   ON clinics USING gin(name gin_trgm_ops);

-- Claim lookups
CREATE INDEX IF NOT EXISTS idx_clinic_claims_user  ON clinic_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_claims_clinic ON clinic_claims(clinic_id);


-- =============================================================================
-- VIEW: clinic_ratings
-- Aggregates average rating and review count per clinic (approved only)
-- =============================================================================
CREATE OR REPLACE VIEW clinic_ratings AS
SELECT
    c.id                                            AS clinic_id,
    c.name                                          AS clinic_name,
    c.slug,
    ROUND(AVG(r.rating)::numeric, 2)               AS avg_rating,
    COUNT(r.id)                                     AS review_count,
    COUNT(r.id) FILTER (WHERE r.rating = 5)        AS five_star_count,
    COUNT(r.id) FILTER (WHERE r.rating >= 4)       AS four_plus_count
FROM clinics c
LEFT JOIN reviews r
    ON r.clinic_id = c.id
    AND r.is_approved = true
GROUP BY c.id, c.name, c.slug;

COMMENT ON VIEW clinic_ratings IS 'Aggregated review stats per clinic (approved reviews only).';


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- leads — clinic owners can only read leads for their own clinics
-- -----------------------------------------------------------------------------
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: clinic owners (approved claim) can SELECT their clinic's leads
CREATE POLICY leads_clinic_owner_select
    ON leads
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id
            FROM clinic_claims
            WHERE user_id = auth.uid()
              AND status = 'approved'
        )
    );

-- Policy: service role / internal inserts (lead capture from public form)
-- Public insert is allowed (anyone can submit a lead)
CREATE POLICY leads_public_insert
    ON leads
    FOR INSERT
    WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- clinic_claims — users can only see their own claims
-- -----------------------------------------------------------------------------
ALTER TABLE clinic_claims ENABLE ROW LEVEL SECURITY;

-- Policy: users see only their own claim records
CREATE POLICY clinic_claims_owner_select
    ON clinic_claims
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: users can insert their own claims
CREATE POLICY clinic_claims_owner_insert
    ON clinic_claims
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: users can update their own pending claims (e.g., resubmit docs)
CREATE POLICY clinic_claims_owner_update
    ON clinic_claims
    FOR UPDATE
    USING (user_id = auth.uid() AND status = 'pending');


-- =============================================================================
-- SEED DATA — 20 Common MedSpa Treatments
-- =============================================================================

INSERT INTO treatments (id, name, slug, category, icon_name) VALUES
    (uuid_generate_v4(), 'Botox',               'botox',                'injectables',      'syringe'),
    (uuid_generate_v4(), 'Juvederm',             'juvederm',             'injectables',      'syringe'),
    (uuid_generate_v4(), 'CoolSculpting',        'coolsculpting',        'body-contouring',  'snowflake'),
    (uuid_generate_v4(), 'HydraFacial',          'hydrafacial',          'skin',             'droplet'),
    (uuid_generate_v4(), 'Microneedling',        'microneedling',        'skin',             'needle'),
    (uuid_generate_v4(), 'Laser Hair Removal',   'laser-hair-removal',   'laser',            'zap'),
    (uuid_generate_v4(), 'Chemical Peel',        'chemical-peel',        'skin',             'flask'),
    (uuid_generate_v4(), 'PRP',                  'prp',                  'injectables',      'droplet'),
    (uuid_generate_v4(), 'Kybella',              'kybella',              'injectables',      'syringe'),
    (uuid_generate_v4(), 'Morpheus8',            'morpheus8',            'skin',             'radio'),
    (uuid_generate_v4(), 'Sculptra',             'sculptra',             'injectables',      'syringe'),
    (uuid_generate_v4(), 'Dysport',              'dysport',              'injectables',      'syringe'),
    (uuid_generate_v4(), 'IPL',                  'ipl',                  'laser',            'sun'),
    (uuid_generate_v4(), 'RF Microneedling',     'rf-microneedling',     'skin',             'radio'),
    (uuid_generate_v4(), 'Semaglutide',          'semaglutide',          'weight-loss',      'pill'),
    (uuid_generate_v4(), 'B12 Injections',       'b12-injections',       'wellness',         'syringe'),
    (uuid_generate_v4(), 'IV Therapy',           'iv-therapy',           'wellness',         'drip'),
    (uuid_generate_v4(), 'Ultherapy',            'ultherapy',            'skin',             'activity'),
    (uuid_generate_v4(), 'Lip Filler',           'lip-filler',           'injectables',      'syringe'),
    (uuid_generate_v4(), 'Skin Tightening',      'skin-tightening',      'skin',             'layers')
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
