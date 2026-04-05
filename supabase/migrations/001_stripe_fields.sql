-- GlowRoute Phase 0: Add Stripe subscription fields to clinics table
-- Run via: supabase db push  OR  paste into Supabase SQL Editor

-- Add plan column (free | basic | pro)
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'basic', 'pro'));

-- Add Stripe customer ID
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe subscription ID
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Add claimed_at timestamp
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Update status column to allow 'claimed' if not already (safe no-op if exists)
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unclaimed';

-- Indexes for webhook lookups
CREATE INDEX IF NOT EXISTS idx_clinics_stripe_customer_id ON clinics (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_clinics_subscription_id ON clinics (subscription_id);
CREATE INDEX IF NOT EXISTS idx_clinics_plan ON clinics (plan);

-- Comments
COMMENT ON COLUMN clinics.plan IS 'Subscription tier: free | basic | pro';
COMMENT ON COLUMN clinics.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN clinics.subscription_id IS 'Stripe Subscription ID (sub_xxx)';
COMMENT ON COLUMN clinics.claimed_at IS 'Timestamp when clinic owner first claimed listing';
COMMENT ON COLUMN clinics.status IS 'Claim status: unclaimed | claimed | verified';
