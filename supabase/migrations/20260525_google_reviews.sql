-- Google Reviews import
-- Extends existing reviews table to support external sources (Google, Yelp, etc.)
-- Adds google_places_connections to track which Google place each project is linked to.

-- ============================================
-- EXTEND reviews TABLE
-- ============================================
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS author_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- Allow customer_name to relax NOT NULL only via source != 'manual'? No — Google reviews always have an author.
-- Keep NOT NULL.

-- Unique per (project, source, external_id) so refreshes upsert instead of duplicate
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reviews_external
  ON reviews(project_id, source, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(project_id, source);

-- ============================================
-- GOOGLE PLACES CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS google_places_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  business_name TEXT,
  formatted_address TEXT,
  rating NUMERIC(2,1),
  user_ratings_total INTEGER,
  attribution_html TEXT,
  google_url TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_gpc_synced ON google_places_connections(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_gpc_place ON google_places_connections(place_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE google_places_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gpc_owner_all ON google_places_connections;
CREATE POLICY gpc_owner_all ON google_places_connections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = google_places_connections.project_id
        AND p.user_id = auth.uid()
    )
  );

-- Public read for connections so storefront can show "Google rating: 4.9 (247)"
DROP POLICY IF EXISTS gpc_public_read ON google_places_connections;
CREATE POLICY gpc_public_read ON google_places_connections
  FOR SELECT
  TO anon, authenticated
  USING (true);
