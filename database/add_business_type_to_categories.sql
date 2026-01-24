-- Add business_type column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_business_type ON categories(business_type);

-- Update existing categories to have a business_type (optional - if you have existing data)
-- You can comment this out if you want to manually assign business types
-- UPDATE categories SET business_type = 'electronics' WHERE business_type IS NULL;
