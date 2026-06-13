-- Atomic credit deduction (media generation had a read-then-write race) and
-- an ip_address column on bookings for rate limiting the public endpoint.
-- Applied to production 2026-06-12 via Supabase MCP.
CREATE OR REPLACE FUNCTION deduct_generation_credits(p_user_id UUID, p_amount INT)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET generation_credits = GREATEST(0, generation_credits - p_amount)
  WHERE id = p_user_id
  RETURNING generation_credits;
$$;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ip_address TEXT;
