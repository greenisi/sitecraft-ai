-- Inbound marketing lead capture from /for/[vertical] landing pages.
-- Distinct from the existing `leads` table, which captures leads ON user-built sites.

CREATE TABLE IF NOT EXISTS public.marketing_signups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  business_name TEXT,
  vertical      TEXT NOT NULL,            -- 'pressure-washing', 'lawn-care', etc.
  source        TEXT,                     -- 'landing_form' | 'ad_meta' | 'youtube' | 'fb_group' | etc.
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  referrer      TEXT,
  user_agent    TEXT,
  ip            TEXT,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'contacted', 'converted', 'unqualified')),
  notes         TEXT,
  converted_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-vertical funnel reports + dedupe lookups.
CREATE INDEX idx_marketing_signups_vertical_time
  ON public.marketing_signups(vertical, created_at DESC);
CREATE INDEX idx_marketing_signups_email
  ON public.marketing_signups(email);
CREATE INDEX idx_marketing_signups_status
  ON public.marketing_signups(status);

-- Locked down. Only the service role writes here (via the signup API route).
-- Admin dashboard reads via the service role too. No anon access.
ALTER TABLE public.marketing_signups ENABLE ROW LEVEL SECURITY;
