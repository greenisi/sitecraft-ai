-- Domain renewal tracking.
--
-- Additive only — existing rows get default auto_renew=true (matches user expectation
-- of "domain stays mine"), and expires_at NULL meaning the renewal job will skip
-- them until we backfill from Name.com getDomain().

ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_charged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS renewal_last_error TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Index for the daily renewal scan.
CREATE INDEX IF NOT EXISTS idx_domains_renewal_due
  ON public.domains(expires_at)
  WHERE domain_type = 'purchased' AND auto_renew = true AND status != 'expired';
