-- Migration: Add business_type column to support Business Switcher
-- Date: 2026-01-10
-- Purpose: Enable filtering admin dashboard by business vertical (Electronics, Furniture, Solar)

-- 1. ADD COLUMNS
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE custom_orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE returns ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- 2. CREATE INDEXES (For performance when filtering)
CREATE INDEX IF NOT EXISTS idx_products_business_type ON products(business_type);
CREATE INDEX IF NOT EXISTS idx_categories_business_type ON categories(business_type);
CREATE INDEX IF NOT EXISTS idx_orders_business_type ON orders(business_type);
CREATE INDEX IF NOT EXISTS idx_invoices_business_type ON invoices(business_type);
CREATE INDEX IF NOT EXISTS idx_custom_orders_business_type ON custom_orders(business_type);
CREATE INDEX IF NOT EXISTS idx_service_bookings_business_type ON service_bookings(business_type);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_business_type ON delivery_tracking(business_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_business_type ON payment_transactions(business_type);
CREATE INDEX IF NOT EXISTS idx_returns_business_type ON returns(business_type);
