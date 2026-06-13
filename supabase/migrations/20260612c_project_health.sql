-- Self-heal tracking: the site-health cron pings every published site,
-- auto-republishes broken ones, and uses heal_attempts to avoid retry loops.
-- Applied to production 2026-06-12 via Supabase MCP.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_status TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS heal_attempts INT DEFAULT 0;
