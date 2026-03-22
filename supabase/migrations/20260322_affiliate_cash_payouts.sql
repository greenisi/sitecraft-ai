-- ============================================================================
-- Affiliate Program: Cash Payout Support
-- Adds payout_method, commission_rate, and pending_payout to affiliates table
-- ============================================================================

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS payout_method TEXT NOT NULL DEFAULT 'free_month'
    CHECK (payout_method IN ('free_month', 'cash')),
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC NOT NULL DEFAULT 0.30,
  ADD COLUMN IF NOT EXISTS pending_payout NUMERIC NOT NULL DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.affiliates.payout_method IS 'Reward type: free_month or cash';
COMMENT ON COLUMN public.affiliates.commission_rate IS 'Fraction of payment credited as cash commission (default 30%)';
COMMENT ON COLUMN public.affiliates.pending_payout IS 'Accumulated cash earnings not yet paid out (USD)';
