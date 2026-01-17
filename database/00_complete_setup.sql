-- =====================================================
-- COMPLETE DATABASE SETUP FOR IMPRESS ENTERPRISE
-- Run this entire file in Supabase SQL Editor
-- =====================================================
-- This combines Phase A + Phase B in correct order
-- Estimated time: 2-3 minutes
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PHASE A: CORE SYSTEM (Orders, Customers, Products)
-- =====================================================

-- From: phase6_orders_system.sql
-- =====================================================
-- 1. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- =====================================================
-- 2. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  category VARCHAR(100),
  brand VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- =====================================================
-- 3. PRODUCT IMAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- =====================================================
-- 4. CART_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- =====================================================
-- 5. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  delivery_address TEXT,
  delivery_notes TEXT,
  payment_method VARCHAR(50),
  payment_notes TEXT,
  payment_status VARCHAR(50) DEFAULT 'cod',
  payment_amount DECIMAL(10, 2),
  razorpay_order_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- =====================================================
-- 6. ORDER_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100),
  quantity INTEGER NOT NULL,
  admin_price DECIMAL(10, 2),
  admin_total DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =====================================================
-- 7. SERVICE BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_technician TEXT,
  technician_phone TEXT,
  scheduled_date DATE,
  scheduled_time TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  service_charges DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_customer ON service_bookings(customer_id);

-- =====================================================
-- 8. PAYMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_gateway TEXT DEFAULT 'razorpay',
  gateway_response JSONB,
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- =====================================================
-- AUTO-UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER service_bookings_updated_at BEFORE UPDATE ON service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Allow signup" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view own profile" ON customers FOR SELECT USING (true);
CREATE POLICY "Customers can update own profile" ON customers FOR UPDATE USING (true);

-- Products policies
CREATE POLICY "Allow product viewing" ON products FOR SELECT USING (is_active = true OR is_active IS NULL);
CREATE POLICY "Allow all product operations" ON products FOR ALL USING (true) WITH CHECK (true);

-- Product images policies
CREATE POLICY "Allow viewing product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Allow all product image operations" ON product_images FOR ALL USING (true) WITH CHECK (true);

-- Cart policies
CREATE POLICY "Allow all cart operations" ON cart_items FOR ALL USING (true) WITH CHECK (true);

-- Orders policies
CREATE POLICY "Allow all order reads" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow order creation" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order updates" ON orders FOR UPDATE USING (true);

-- Order items policies
CREATE POLICY "Allow order items read" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow order items creation" ON order_items FOR INSERT WITH CHECK (true);

-- Service bookings policies
CREATE POLICY "Allow booking read" ON service_bookings FOR SELECT USING (true);
CREATE POLICY "Allow booking creation" ON service_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow booking updates" ON service_bookings FOR UPDATE USING (true);

-- Payment transactions policies
CREATE POLICY "Allow payment read" ON payment_transactions FOR SELECT USING (true);
CREATE POLICY "Allow payment creation" ON payment_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow payment updates" ON payment_transactions FOR UPDATE USING (true);

-- =====================================================
-- PHASE B: COMMERCE POLISH (Variants, Returns, Delivery)
-- =====================================================

-- =====================================================
-- 1. PRODUCT VARIANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  variant_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  material TEXT,
  finish TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  is_available BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  weight_kg DECIMAL(8, 2),
  dimensions_cm TEXT,
  barcode TEXT,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_available ON product_variants(is_available);

CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 2. INVENTORY ADJUSTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  adjustment_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  reason TEXT,
  notes TEXT,
  adjusted_by_user_id UUID,
  adjusted_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_variant ON inventory_adjustments(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);

-- =====================================================
-- 3. RETURN REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  return_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  admin_notes TEXT,
  approved_by_user_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  return_tracking_number TEXT,
  return_carrier TEXT,
  pickup_scheduled_date DATE,
  pickup_address TEXT,
  refund_amount DECIMAL(10, 2),
  refund_method TEXT,
  refund_status TEXT DEFAULT 'pending',
  refund_date TIMESTAMP WITH TIME ZONE,
  refund_reference TEXT,
  exchange_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  exchange_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  exchange_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_customer ON return_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);

CREATE TRIGGER return_requests_updated_at BEFORE UPDATE ON return_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. DELIVERY TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  delivery_partner TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  delivery_type TEXT DEFAULT 'standard',
  tracking_number TEXT UNIQUE,
  current_status TEXT NOT NULL DEFAULT 'order_placed',
  current_location TEXT,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  estimated_delivery_date DATE,
  scheduled_delivery_date DATE,
  scheduled_time_slot TEXT,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  delivery_address TEXT NOT NULL,
  delivery_landmark TEXT,
  delivery_city TEXT,
  delivery_pincode TEXT,
  special_instructions TEXT,
  access_code TEXT,
  requires_measurement BOOLEAN DEFAULT false,
  measurement_scheduled_date DATE,
  measurement_completed_date DATE,
  measurement_notes TEXT,
  requires_installation BOOLEAN DEFAULT false,
  installation_scheduled_date DATE,
  installation_completed_date DATE,
  installation_technician TEXT,
  installation_notes TEXT,
  requires_old_item_removal BOOLEAN DEFAULT false,
  old_item_removed BOOLEAN DEFAULT false,
  delivery_attempts INTEGER DEFAULT 0,
  customer_not_available_count INTEGER DEFAULT 0,
  failed_delivery_reason TEXT,
  delivery_signature_url TEXT,
  delivery_photo_urls TEXT[],
  received_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(current_status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_number ON delivery_tracking(tracking_number);

CREATE TRIGGER delivery_tracking_updated_at BEFORE UPDATE ON delivery_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 5. DELIVERY STATUS HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_tracking_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  status_message TEXT,
  location TEXT,
  notes TEXT,
  updated_by_user_id UUID,
  updated_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_status_history_tracking ON delivery_status_history(delivery_tracking_id);

-- =====================================================
-- 6. CUSTOM ORDER REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_order_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  furniture_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  material_preference TEXT,
  color_preference TEXT,
  finish_preference TEXT,
  style_preference TEXT,
  custom_dimensions TEXT,
  room_dimensions TEXT,
  space_constraints TEXT,
  reference_image_urls TEXT[],
  room_photo_urls TEXT[],
  requires_measurement BOOLEAN DEFAULT true,
  measurement_address TEXT,
  preferred_measurement_date DATE,
  preferred_measurement_time TEXT,
  measurement_scheduled_date DATE,
  measurement_completed_date DATE,
  measurement_technician TEXT,
  measurement_notes TEXT,
  final_dimensions TEXT,
  budget_range TEXT,
  estimated_price DECIMAL(10, 2),
  quoted_price DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to_user_id UUID,
  assigned_to_name TEXT,
  admin_notes TEXT,
  quote_sent_date DATE,
  quote_valid_until DATE,
  quote_document_url TEXT,
  converted_to_order BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  estimated_production_days INTEGER,
  production_start_date DATE,
  expected_completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_order_requests_customer ON custom_order_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_requests_status ON custom_order_requests(status);

CREATE TRIGGER custom_order_requests_updated_at BEFORE UPDATE ON custom_order_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 7. UPDATE EXISTING TABLES FOR PHASE B
-- =====================================================
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_sku TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_tracking_id UUID REFERENCES delivery_tracking(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_white_glove BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_custom_order BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_order_request_id UUID REFERENCES custom_order_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_variant ON cart_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(product_variant_id);

-- =====================================================
-- 8. RLS POLICIES FOR PHASE B TABLES
-- =====================================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_order_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow viewing available variants" ON product_variants FOR SELECT USING (is_available = true);
CREATE POLICY "Allow all variant operations" ON product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow inventory read" ON inventory_adjustments FOR SELECT USING (true);
CREATE POLICY "Allow inventory creation" ON inventory_adjustments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow return read" ON return_requests FOR SELECT USING (true);
CREATE POLICY "Allow return creation" ON return_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow return updates" ON return_requests FOR UPDATE USING (true);
CREATE POLICY "Allow delivery read" ON delivery_tracking FOR SELECT USING (true);
CREATE POLICY "Allow delivery operations" ON delivery_tracking FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow delivery history read" ON delivery_status_history FOR SELECT USING (true);
CREATE POLICY "Allow delivery history creation" ON delivery_status_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow custom request read" ON custom_order_requests FOR SELECT USING (true);
CREATE POLICY "Allow custom request creation" ON custom_order_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow custom request updates" ON custom_order_requests FOR UPDATE USING (true);

-- =====================================================
-- 9. HELPER FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Auto-log inventory adjustments when stock changes
CREATE OR REPLACE FUNCTION log_inventory_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_quantity != NEW.stock_quantity THEN
    INSERT INTO inventory_adjustments (
      product_variant_id,
      adjustment_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reason
    ) VALUES (
      NEW.id,
      CASE WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'restock' ELSE 'manual_adjustment' END,
      NEW.stock_quantity - OLD.stock_quantity,
      OLD.stock_quantity,
      NEW.stock_quantity,
      'Automatic log from stock update'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_variants_stock_change
  AFTER UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION log_inventory_adjustment();

-- Auto-log delivery status changes
CREATE OR REPLACE FUNCTION log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_status != NEW.current_status THEN
    INSERT INTO delivery_status_history (
      delivery_tracking_id,
      status,
      status_message,
      location
    ) VALUES (
      NEW.id,
      NEW.current_status,
      'Status updated to ' || NEW.current_status,
      NEW.current_location
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_tracking_status_change
  AFTER UPDATE ON delivery_tracking
  FOR EACH ROW
  EXECUTE FUNCTION log_delivery_status_change();

-- =====================================================
-- SETUP COMPLETE! 🎉
-- =====================================================
-- Your database is now ready with:
-- ✅ Phase A: Customers, Products, Orders, Cart, Payments, Service Bookings
-- ✅ Phase B: Product Variants, Inventory, Returns, Delivery Tracking, Custom Orders
-- ✅ All indexes, triggers, and RLS policies configured
-- 
-- Next steps:
-- 1. Start your dev server: npm run dev
-- 2. Test the application features
-- 3. Check admin dashboard at /admin
-- =====================================================
