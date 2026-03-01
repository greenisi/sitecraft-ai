-- Fix Missing Database Columns Migration
-- This migration adds columns that may be missing from existing tables
-- when the tables were created before the columns were added to the schema

-- Add missing columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration TEXT;

-- Add missing columns to products table  
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 0;

-- Add missing columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Also ensure business_type exists on projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT NULL;
