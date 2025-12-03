-- Add cashier_id column to purchases table to track which user created each purchase
-- This allows the receipts page to show who processed each transaction
-- Run this script in the Supabase SQL editor

-- Step 1: Add cashier_id column
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_cashier_id ON purchases(cashier_id);

-- Step 3: Create index for receipt_number for faster grouping
CREATE INDEX IF NOT EXISTS idx_purchases_receipt_number ON purchases(receipt_number);

-- Note: Existing purchases will have NULL cashier_id
-- New purchases will automatically include the cashier_id from the authenticated user








