-- ============================================================================
-- Innovated Marketing - Stripe Connect Integration
-- Allows customers to connect their Stripe accounts to receive payments
-- from their generated e-commerce websites
-- ============================================================================

-- Add Stripe Connect fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_connect
  ON public.profiles(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;
