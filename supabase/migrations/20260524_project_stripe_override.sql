-- Per-project Stripe override.
--
-- Default behavior (already in place): payments use the project owner's
-- profiles.stripe_connect_account_id — one Stripe across all their projects.
--
-- When set, these per-project columns take precedence — useful when a user
-- runs multiple separate businesses out of one SiteCraft account and wants
-- each project to settle into a different bank.
--
-- The checkout resolver does: project's account → fallback to user's account.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id         TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled     BOOLEAN NOT NULL DEFAULT false;

-- Lookup used by the webhook to find which row owns an inbound account event.
CREATE INDEX IF NOT EXISTS idx_projects_stripe_account
  ON public.projects(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;
