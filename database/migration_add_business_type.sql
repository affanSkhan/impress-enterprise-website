-- Migration: Add business_type column to support Business Switcher
-- Date: 2026-01-10
-- Purpose: Enable filtering admin dashboard by business vertical (Electronics, Furniture, Solar)

-- 1. ADD COLUMNS
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE returns ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- 2. CREATE INDEXES (For performance when filtering)
CREATE INDEX IF NOT EXISTS idx_products_business_type ON products(business_type);
CREATE INDEX IF NOT EXISTS idx_orders_business_type ON orders(business_type);
CREATE INDEX IF NOT EXISTS idx_service_bookings_business_type ON service_bookings(business_type);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_business_type ON delivery_tracking(business_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_business_type ON payment_transactions(business_type);
CREATE INDEX IF NOT EXISTS idx_returns_business_type ON returns(business_type);

-- 3. UPDATE RLS POLICIES (Example: If we were restricting by business_type, we would add policies here)
-- For now, we rely on the Admin Dashboard filtering logic, but we should ensure the business_type is readable.
-- Existing 'Select' policies typically use USING (true) or user-based checks, so reading the new column should be fine.

-- 4. BACKFILL INSTRUCTIONS
-- Currently, data might be mixed. Admin should run updates to classify existing data.
-- Example: 
-- UPDATE products SET business_type = 'Electronics' WHERE category_id_or_name LIKE '%Air Con%';
-- UPDATE orders SET business_type = 'Electronics' WHERE id IN (SELECT order_id FROM order_items WHERE product_id IN (SELECT id FROM products WHERE business_type = 'Electronics'));

-- For this initial migration, we mark them as NULL (Unknown) or set a default if preferred.
-- We will leave them NULL so they show up as "Unknown" or "All" until classified.
