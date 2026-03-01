# Database Migrations

This directory contains SQL migration files for the SiteCraft AI database schema.

## Current Migrations

| File | Description |
|------|-------------|
| `20260301_complete_bcms_schema.sql` | **IMPORTANT** - Adds all missing columns for BCMS features |

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from the migration file
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Option 2: Supabase CLI

If you have the Supabase CLI configured:

```bash
# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### Option 3: Direct SQL Execution

You can also run the SQL directly using any PostgreSQL client connected to your Supabase database.

---

## Complete SQL to Apply (Copy/Paste Ready)

If you just need to quickly fix the schema, copy and run this SQL in your Supabase SQL Editor:

```sql
-- Add missing columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add missing columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_size TEXT;

-- Ensure business_type exists on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS business_type TEXT;
```

---

## Missing Columns Summary

| Table | Column | Type | Default | Status |
|-------|--------|------|---------|--------|
| services | duration | TEXT | NULL | Missing |
| services | sort_order | INTEGER | 0 | Missing |
| products | inventory_count | INTEGER | 0 | Missing |
| products | sort_order | INTEGER | 0 | Missing |
| properties | sort_order | INTEGER | 0 | Missing |
| properties | lot_size | TEXT | NULL | Missing |
| projects | business_type | TEXT | NULL | ✅ Applied |

## Verification

After running the migration, verify the columns exist:

```sql
-- Check all columns were added
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name IN ('services', 'products', 'properties', 'projects')
  AND column_name IN ('duration', 'sort_order', 'inventory_count', 'lot_size', 'business_type')
ORDER BY table_name, column_name;
```

Expected output should show 7 rows (all the columns listed above).
