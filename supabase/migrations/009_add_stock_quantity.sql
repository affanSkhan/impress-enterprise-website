-- Add stock_quantity column to products table
-- This is required by the trigger_notify_low_stock trigger

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Add index for stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);

-- Add comment
COMMENT ON COLUMN products.stock_quantity IS 'Current stock quantity for inventory tracking';
