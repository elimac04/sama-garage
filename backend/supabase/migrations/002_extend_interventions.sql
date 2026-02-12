-- ============================================================
-- Migration: Extend interventions table
-- Add advance_payment, remaining_amount, diagnostic_result fields
-- Expand type CHECK to include 'maintenance' and 'other'
-- ============================================================

-- Add new columns
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS advance_payment DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS diagnostic_result TEXT;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS diagnostic_result_name VARCHAR(255);

-- Update type CHECK constraint to include new types
ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_type_check;
ALTER TABLE interventions ADD CONSTRAINT interventions_type_check CHECK (type IN ('diagnostic', 'repair', 'maintenance', 'other'));
