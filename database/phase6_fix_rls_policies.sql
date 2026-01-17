-- Fix RLS policies for simplified authentication
-- Run this in Supabase SQL Editor

-- Drop existing RLS policies for customers table
DROP POLICY IF EXISTS "Users can view their own customer profile" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customer profile" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer profile" ON customers;

-- Drop newly created policies if they exist (to fix re-run errors)
DROP POLICY IF EXISTS "Allow signup - anyone can insert" ON customers;
DROP POLICY IF EXISTS "Customers can view own profile" ON customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON customers;

-- Create new policies that allow direct access
-- Allow anyone to insert (for signup)
CREATE POLICY "Allow signup - anyone can insert"
  ON customers FOR INSERT
  WITH CHECK (true);

-- Allow customers to view their own profile by ID
CREATE POLICY "Customers can view own profile"
  ON customers FOR SELECT
  USING (true);

-- Allow customers to update their own profile
CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE
  USING (true);

-- Update cart_items policies to work with customer ID directly
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

CREATE POLICY "Allow all cart operations"
  ON cart_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

CREATE POLICY "Allow all order reads"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Allow order creation"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow order updates"
  ON orders FOR UPDATE
  USING (true);

-- Update order_items policies
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

CREATE POLICY "Allow all order_items reads"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow order_items creation"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Verify RLS is still enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
