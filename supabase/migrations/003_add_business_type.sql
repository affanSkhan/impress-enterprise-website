-- Migration: Add business_type column to support Business Switcher
-- Date: 2026-01-17
-- Purpose: Enable filtering admin dashboard by business vertical (Electronics, Furniture, Solar, All)

-- 1. ADD COLUMNS TO EXISTING TABLES
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
-- Note: custom_orders, delivery_tracking, payment_transactions, returns tables not yet created
-- Run their respective migration files first if needed

-- 2. CREATE INDEXES (For performance when filtering)
CREATE INDEX IF NOT EXISTS idx_products_business_type ON products(business_type);
CREATE INDEX IF NOT EXISTS idx_orders_business_type ON orders(business_type);
CREATE INDEX IF NOT EXISTS idx_order_items_business_type ON order_items(business_type);
CREATE INDEX IF NOT EXISTS idx_invoices_business_type ON invoices(business_type);
CREATE INDEX IF NOT EXISTS idx_service_bookings_business_type ON service_bookings(business_type);

-- 3. UPDATE RLS POLICIES
-- Existing policies should work, but ensure business_type is readable
-- No changes needed as policies use user-based checks

-- 4. BACKFILL INSTRUCTIONS
-- Admin should classify existing data:
-- UPDATE products SET business_type = 'electronics' WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%electronics%');
-- UPDATE orders SET business_type = 'electronics' WHERE id IN (SELECT order_id FROM order_items WHERE product_id IN (SELECT id FROM products WHERE business_type = 'electronics'));
-- Repeat for other business types: 'furniture', 'solar'

-- For unclassified data, leave as NULL (will show as 'all' in dashboard)