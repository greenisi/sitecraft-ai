-- One-click confirm/decline links in owner alert emails need a per-booking
-- secret, and visitor booking forms capture a free-text service name that
-- doesn't always match a services row.
-- Applied to production 2026-06-12 via Supabase MCP.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manage_token TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_type TEXT;
