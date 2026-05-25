-- Replace the partial unique index with a real unique constraint so
-- ON CONFLICT works. The original migration used a partial index
--   (project_id, source, external_id) WHERE external_id IS NOT NULL
-- which Postgres won't honor for ON CONFLICT.
--
-- A full unique constraint is safe here: Postgres treats NULLs as distinct
-- in UNIQUE constraints, so manual reviews (external_id IS NULL) won't
-- collide with each other.
DROP INDEX IF EXISTS uniq_reviews_external;
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_external_unique;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_external_unique UNIQUE (project_id, source, external_id);
