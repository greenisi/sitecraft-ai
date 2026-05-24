-- WHOIS contact for ICANN-compliant domain purchases.
-- Stored per user on profiles. Required before any domain registration.
--
-- Shape (validated in API, not DB, so we can iterate fields without migrations):
--   {
--     "firstName":    string,
--     "lastName":     string,
--     "organization": string?,
--     "email":        string,
--     "phone":        string,      -- E.164, e.g. "+15555550100"
--     "address1":     string,
--     "address2":     string?,
--     "city":         string,
--     "state":        string,
--     "zip":          string,
--     "country":      string       -- ISO-3166 alpha-2, e.g. "US"
--   }
--
-- Privacy: we always purchase with Name.com WHOIS privacy enabled (where the
-- TLD supports it), so the user's real contact info is masked in public WHOIS
-- but on file with the registrar for compliance.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whois_contact JSONB;

-- Index so we can quickly find profiles missing WHOIS (for UI prompts).
CREATE INDEX IF NOT EXISTS idx_profiles_whois_missing
  ON public.profiles((whois_contact IS NULL))
  WHERE whois_contact IS NULL;
