-- Add personalization_order column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS personalization_order INTEGER NOT NULL DEFAULT 0;
