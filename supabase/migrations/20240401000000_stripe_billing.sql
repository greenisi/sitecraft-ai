-- ============================================================================
-- Innovated Marketing - Stripe Billing Integration
-- ============================================================================

-- Add stripe_subscription_id column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update the plan CHECK constraint to include 'beta'
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IN ('free', 'beta', 'pro', 'team'));

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON public.profiles(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Create index on stripe_subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
ON public.profiles(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;
