-- Shared customer data between a user's projects.
--
-- Owners running more than one site for the SAME business want one customer
-- list and one order queue, not two half-empty dashboards. Owners running
-- sites for DIFFERENT businesses (agencies, which is most of this product's
-- power users) must never see one client's leads inside another's project.
--
-- So projects carry a data group. By default every project is its own group,
-- which is exactly today's behaviour -- nothing changes for existing projects.
-- Opting in at project creation puts the new project into an existing group.
--
-- Writes are unaffected: form_submissions, bookings and orders keep their real
-- project_id, so we never lose which site a customer actually came through.
-- Only READS widen to the group.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS data_group_id uuid;

-- Every existing project becomes its own group: current behaviour preserved.
UPDATE projects
   SET data_group_id = id
 WHERE data_group_id IS NULL;

ALTER TABLE projects
  ALTER COLUMN data_group_id SET DEFAULT gen_random_uuid();

-- Group lookups run on every dashboard load.
CREATE INDEX IF NOT EXISTS projects_data_group_id_idx
  ON projects (data_group_id);

-- Guards the read-widening: a group must never span two owners, or one user's
-- leads could surface in another user's dashboard.
CREATE INDEX IF NOT EXISTS projects_user_data_group_idx
  ON projects (user_id, data_group_id);

COMMENT ON COLUMN projects.data_group_id IS
  'Projects sharing this id pool their customer data (leads, bookings, orders). Defaults to the project''s own id, i.e. not shared.';

-- Applied alongside: capability acceptance, follow-up answers, and the two
-- business_info fields the post-build questions needed a home for.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS accepted_capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS follow_up_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE business_info
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS service_area text;
