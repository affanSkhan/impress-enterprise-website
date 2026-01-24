-- Verify Product Business Type Setup
-- Run this in Supabase SQL Editor to check if products have correct business_type

-- 1. Check all products and their business_type
SELECT 
    id,
    name,
    business_type,
    category_id,
    is_active,
    created_at
FROM products
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check if your electronics product exists
SELECT 
    p.id,
    p.name,
    p.business_type,
    c.name as category_name,
    c.business_type as category_business_type,
    p.is_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.business_type = 'electronics'
ORDER BY p.created_at DESC;

-- 3. Update any products with NULL or incorrect business_type
-- UNCOMMENT the lines below to fix products if needed

-- Update products with NULL business_type based on their category
-- UPDATE products p
-- SET business_type = c.business_type
-- FROM categories c
-- WHERE p.category_id = c.id
-- AND p.business_type IS NULL
-- AND c.business_type IS NOT NULL;

-- Or manually set a specific product to electronics:
-- UPDATE products
-- SET business_type = 'electronics'
-- WHERE id = 'YOUR-PRODUCT-ID-HERE';

-- 4. Verify categories have business_type
SELECT 
    id,
    name,
    business_type,
    created_at
FROM categories
ORDER BY business_type, name;
