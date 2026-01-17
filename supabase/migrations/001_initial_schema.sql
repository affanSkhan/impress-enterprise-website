-- =====================================================
-- IMPRESS ENTERPRISE - DATABASE SCHEMA
-- Phase 1: Core Tables Migration
-- Updated for multi-business support
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: categories
-- Stores product categories (global across businesses)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add slug column if it doesn't exist (for existing tables)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;
ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- Index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =====================================================
-- TABLE: customers
-- Stores customer information
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_unique;
ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- =====================================================
-- TABLE: products
-- Stores spare parts information with business type
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  car_model TEXT,
  brand TEXT,
  description TEXT,
  price NUMERIC(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  business_type VARCHAR(50), -- 'electronics', 'furniture', 'solar', 'all'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_unique;
ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_business_type ON products(business_type);

-- =====================================================
-- TABLE: product_images
-- Stores product image URLs from Supabase Storage
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Index for faster product image lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- =====================================================
-- TABLE: orders
-- Stores order information with business type
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total NUMERIC(10, 2),
  business_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add business_type column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_business_type ON orders(business_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =====================================================
-- TABLE: order_items
-- Stores line items for each order
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(10, 2);

-- Index for faster order item lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =====================================================
-- TABLE: invoices
-- Stores invoice headers with business type
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subtotal NUMERIC(10, 2),
  tax_percent NUMERIC(5, 2),
  tax_amount NUMERIC(10, 2),
  total NUMERIC(10, 2),
  business_type VARCHAR(50),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_unique;
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_percent NUMERIC(5, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add business_type column if it doesn't exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Index for faster invoice number lookups
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_business_type ON invoices(business_type);

-- =====================================================
-- TABLE: invoice_items
-- Stores line items for each invoice
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(10, 2);

-- Index for faster invoice item lookups
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =====================================================
-- TABLE: service_bookings
-- Stores service booking information with business type
-- =====================================================
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  business_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS booking_date DATE;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS booking_time TIME;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Add business_type column if it doesn't exist
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_business_type ON service_bookings(business_type);

-- =====================================================
-- TABLE: user_roles
-- Stores user role information (admin/staff)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'admin';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Public read access to categories (for public catalogue)
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

-- Admins can manage categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Public read access to customers (for public forms)
DROP POLICY IF EXISTS "Public can view customers" ON customers;
CREATE POLICY "Public can view customers" ON customers
  FOR SELECT USING (true);

-- Admins can manage customers
DROP POLICY IF EXISTS "Admins can manage customers" ON customers;
CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Public read access to active products (for public catalogue)
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Admins can manage products
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Public read access to product images
DROP POLICY IF EXISTS "Public can view product images" ON product_images;
CREATE POLICY "Public can view product images" ON product_images
  FOR SELECT USING (true);

-- Admins can manage product images
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
CREATE POLICY "Admins can manage product images" ON product_images
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Only admins can view/manage orders
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Only admins can view/manage order items
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Only admins can view/manage invoices
DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Only admins can view/manage invoice items
DROP POLICY IF EXISTS "Admins can manage invoice items" ON invoice_items;
CREATE POLICY "Admins can manage invoice items" ON invoice_items
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Only admins can view/manage service bookings
DROP POLICY IF EXISTS "Admins can manage service bookings" ON service_bookings;
CREATE POLICY "Admins can manage service bookings" ON service_bookings
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Disable RLS on user_roles (admin-only table, security handled at app level)
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, slug) VALUES
  ('Engine Parts', 'engine-parts'),
  ('Brake System', 'brake-system'),
  ('Suspension', 'suspension'),
  ('Electrical', 'electrical'),
  ('Filters', 'filters')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                          LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Trigger to auto-generate invoice numbers
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON invoices;
CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Migration completed successfully!
-- Next steps:
-- 1. Set up Storage buckets (see setup instructions)
-- 2. Create your first admin user
-- 3. Add the user to user_roles table
-- =====================================================
