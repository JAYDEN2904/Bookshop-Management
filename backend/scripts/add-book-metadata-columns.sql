-- Adds extended metadata columns to the books table so the inventory UI can persist supplier,
-- cost price, minimum stock, and other attributes.
-- Run this script in the Supabase SQL editor (or psql) before redeploying the backend.

-- Step 1: Add columns with defaults (allows NULL initially for existing rows)
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'textbook',
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Ensure existing rows have sensible defaults for the new fields
UPDATE books
SET
  type = COALESCE(type, 'textbook'),
  cost_price = COALESCE(cost_price, 0),
  min_stock = COALESCE(min_stock, 0)
WHERE type IS NULL OR cost_price IS NULL OR min_stock IS NULL;

-- Step 3: Add NOT NULL constraints to match the schema (only for columns that should be NOT NULL)
-- Note: This will fail if there are any NULL values, but the UPDATE above should prevent that
DO $$
BEGIN
  -- Add NOT NULL constraint to type if it doesn't already have it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' 
    AND column_name = 'type' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE books ALTER COLUMN type SET NOT NULL;
  END IF;

  -- Add NOT NULL constraint to cost_price if it doesn't already have it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' 
    AND column_name = 'cost_price' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE books ALTER COLUMN cost_price SET NOT NULL;
  END IF;

  -- Add NOT NULL constraint to min_stock if it doesn't already have it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' 
    AND column_name = 'min_stock' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE books ALTER COLUMN min_stock SET NOT NULL;
  END IF;
END $$;

