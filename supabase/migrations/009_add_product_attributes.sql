-- Migration: Add business-specific product attributes
-- Adds SKU, warranty, specs, material, dimensions, and solar-specific fields

ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_months INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS wattage NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS panel_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_years INTEGER;

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_wattage ON products(wattage);

-- Comments
COMMENT ON COLUMN products.sku IS 'Stock keeping unit for electronics';
COMMENT ON COLUMN products.specs IS 'JSON or text with detailed specifications';
COMMENT ON COLUMN products.material IS 'Material used for furniture items';
COMMENT ON COLUMN products.length IS 'Length in cm';
COMMENT ON COLUMN products.width IS 'Width in cm';
COMMENT ON COLUMN products.height IS 'Height in cm';
COMMENT ON COLUMN products.wattage IS 'Wattage for solar products in watts';
COMMENT ON COLUMN products.panel_type IS 'Type of solar panel';
COMMENT ON COLUMN products.warranty_years IS 'Warranty in years for solar products';
