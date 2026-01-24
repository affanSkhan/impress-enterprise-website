-- Fix products table schema for category relationship
-- This script ensures the products table has proper foreign key to categories

-- First, check if category_id column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'category_id') THEN
        ALTER TABLE products ADD COLUMN category_id UUID;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_category_id_fkey' 
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_category_id_fkey 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure RLS is enabled on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;

-- Create a policy to allow public read access to all categories
CREATE POLICY "Public read access to categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

-- Ensure products table has public read access
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;

CREATE POLICY "Public read access to active products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Ensure product_images table has public read access
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view product images" ON product_images;
DROP POLICY IF EXISTS "Enable read access for all users" ON product_images;

CREATE POLICY "Public read access to product images"
ON product_images FOR SELECT
TO anon, authenticated
USING (true);
