-- Migration: Payment and Referral Bug Fixes
-- Run this in your Supabase SQL Editor

-- ============================================
-- FIX 1: Processed Sessions Table (Prevent Double Credit Fulfillment)
-- ============================================
CREATE TABLE IF NOT EXISTS processed_stripe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_type TEXT,
  mode TEXT, -- 'subscription' or 'payment'
  credits_added INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by TEXT NOT NULL -- 'webhook' or 'verify-session'
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_sessions_session_id ON processed_stripe_sessions(session_id);

-- RLS policy for processed_sessions
ALTER TABLE processed_stripe_sessions ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert/read (API routes use service role)
CREATE POLICY "Service role full access" ON processed_stripe_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FIX 3: Referral Tracking Tables
-- ============================================

-- Add referral columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Create index on referral_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Referral tracking table for statistics
CREATE TABLE IF NOT EXISTS referral_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id)
);

-- Referral events table for detailed tracking
CREATE TABLE IF NOT EXISTS referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'click', 'signup', 'conversion'
  conversion_amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for referral tables
CREATE INDEX IF NOT EXISTS idx_referral_stats_referrer ON referral_stats(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_type ON referral_events(event_type);

-- RLS policies for referral tables
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral stats
CREATE POLICY "Users can read own referral stats" ON referral_stats
  FOR SELECT USING (referrer_id = auth.uid());

-- Users can read their own referral events  
CREATE POLICY "Users can read own referral events" ON referral_events
  FOR SELECT USING (referrer_id = auth.uid());

-- Service role can manage all referral data
CREATE POLICY "Service role manages referral stats" ON referral_stats
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "Service role manages referral events" ON referral_events
  FOR ALL USING (true) WITH CHECK (true);

-- Function to generate unique referral code for new users
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a unique 8-character referral code
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on profile creation
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON profiles;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION generate_referral_code();

-- Update existing profiles to have referral codes
UPDATE profiles 
SET referral_code = UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Create referral_stats entries for existing users
INSERT INTO referral_stats (referrer_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT referrer_id FROM referral_stats)
ON CONFLICT (referrer_id) DO NOTHING;

-- ============================================
-- Summary
-- ============================================
-- Tables created:
-- 1. processed_stripe_sessions - Tracks which Stripe sessions have been fulfilled
-- 2. referral_stats - Aggregated referral statistics per user
-- 3. referral_events - Individual referral events for detailed tracking
-- 
-- Columns added to profiles:
-- 1. referral_code - Unique code for sharing referral links
-- 2. referred_by - References the user who referred this user
