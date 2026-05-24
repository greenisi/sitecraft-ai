-- Pin each project's "currently published" generation explicitly.
--
-- Before this migration, publishToSubdomain always picked the LATEST complete
-- generation_version. That meant: if a user regenerated a buggy new version
-- after publishing, the next publish would overwrite their working live site.
--
-- After this migration:
--   - publishToSubdomain accepts an optional version_id (defaults to latest)
--   - On success it writes back published_version_id, so we have a clear
--     "this is what's live" pointer
--   - The rollback endpoint passes a specific historical version_id

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS published_version_id UUID
    REFERENCES public.generation_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_published_version
  ON public.projects(published_version_id)
  WHERE published_version_id IS NOT NULL;
