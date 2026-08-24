-- Review submissions become a public, CORS-open, unauthenticated write path
-- once generated sites can reach them, so they need the same per-IP rate
-- limiting form_submissions and bookings already have.
--
-- checkSubmissionRate filters on ip_address. Without this column that query
-- throws and the guard fails open silently, which looks like working rate
-- limiting right up until someone floods the owner's moderation queue.
--
-- Additive only.

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_rate_check
  ON public.reviews(project_id, ip_address, created_at DESC);
