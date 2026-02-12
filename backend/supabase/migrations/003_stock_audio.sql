-- ============================================================
-- Migration: Add audio column to stock_items
-- Stores base64-encoded audio description for articles
-- ============================================================

ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS audio TEXT;
