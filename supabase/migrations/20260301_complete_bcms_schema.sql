-- ============================================================================
-- COMPLETE BCMS SCHEMA MIGRATION
-- ============================================================================
-- This migration adds ALL missing columns discovered during testing.
-- Run this in your Supabase SQL Editor to fix all database schema issues.
-- ============================================================================

-- Add missing columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- Add missing columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_size TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mls_number TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title TEXT;

-- Ensure business_type exists on projects (already applied, included for completeness)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all columns were added successfully:

-- Check services columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'services' AND column_name IN ('duration', 'sort_order', 'features');

-- Check products columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name IN ('inventory_count', 'sort_order', 'variants');

-- Check properties columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'properties' AND column_name IN ('sort_order', 'lot_size', 'mls_number');

-- Check projects columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'projects' AND column_name = 'business_type';
