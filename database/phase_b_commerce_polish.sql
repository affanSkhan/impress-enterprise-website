-- Phase B: Commerce Polish - Product Variants, Inventory, Returns & Delivery
-- Run this SQL in your Supabase SQL Editor after Phase A setup

-- =====================================================
-- 1. PRODUCT VARIANTS TABLE
-- =====================================================
-- Stores different variants of products (size, color, material, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Variant details
  sku TEXT UNIQUE NOT NULL, -- Stock Keeping Unit (unique identifier)
  variant_name TEXT NOT NULL, -- e.g., "Large - Red", "Queen Size - Oak"
  
  -- Variant attributes
  size TEXT, -- Small, Medium, Large, Custom dimensions
  color TEXT, -- Red, Blue, Natural Wood, etc.
  material TEXT, -- Wood, Metal, Fabric, etc.
  finish TEXT, -- Matte, Glossy, Textured, etc.
  
  -- Pricing & Stock
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2), -- Original price for showing discounts
  cost_price DECIMAL(10, 2), -- Cost to business (for profit tracking)
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5, -- Alert when stock goes below this
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default variant when product is selected
  
  -- Additional details
  weight_kg DECIMAL(8, 2), -- For shipping calculations
  dimensions_cm TEXT, -- e.g., "120x80x75" (LxWxH)
  barcode TEXT,
  
  -- Images (variant-specific images)
  image_urls TEXT[], -- Array of image URLs for this variant
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_available ON product_variants(is_available);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();

-- =====================================================
-- 2. INVENTORY ADJUSTMENTS TABLE
-- =====================================================
-- Tracks all inventory changes with reason and timestamp
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  
  -- Adjustment details
  adjustment_type TEXT NOT NULL, -- 'sale', 'return', 'restock', 'damage', 'theft', 'correction'
  quantity_change INTEGER NOT NULL, -- Positive for additions, negative for reductions
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  
  -- Reference information
  reference_type TEXT, -- 'order', 'return', 'manual', 'supplier_delivery'
  reference_id UUID, -- ID of related order, return, etc.
  
  -- Additional info
  reason TEXT,
  notes TEXT,
  
  -- User tracking
  adjusted_by_user_id UUID, -- Admin who made the adjustment
  adjusted_by_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_variant ON inventory_adjustments(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_date ON inventory_adjustments(created_at);

-- =====================================================
-- 3. RETURN REQUESTS TABLE
-- =====================================================
-- Manages product returns and exchanges
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT UNIQUE NOT NULL,
  
  -- Order reference
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  
  -- Return details
  return_type TEXT NOT NULL, -- 'refund', 'exchange', 'store_credit'
  reason TEXT NOT NULL, -- 'damaged', 'wrong_item', 'not_as_described', 'changed_mind', etc.
  description TEXT NOT NULL, -- Customer's detailed explanation
  
  -- Product details
  product_name TEXT NOT NULL,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Images
  image_urls TEXT[], -- Photos of damaged/wrong items
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'in_transit', 'received', 'completed'
  
  -- Admin handling
  admin_response TEXT,
  admin_notes TEXT,
  approved_by_user_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Return shipping
  return_tracking_number TEXT,
  return_carrier TEXT,
  pickup_scheduled_date DATE,
  pickup_address TEXT,
  
  -- Refund details
  refund_amount DECIMAL(10, 2),
  refund_method TEXT, -- 'original_payment', 'store_credit', 'bank_transfer'
  refund_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  refund_date TIMESTAMP WITH TIME ZONE,
  refund_reference TEXT,
  
  -- Exchange details (if return_type = 'exchange')
  exchange_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  exchange_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  exchange_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_customer ON return_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_date ON return_requests(created_at);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_return_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_return_requests_updated_at();

-- =====================================================
-- 4. DELIVERY TRACKING TABLE (Enhanced)
-- =====================================================
-- Detailed delivery tracking with multiple checkpoints
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Delivery assignment
  delivery_partner TEXT, -- 'in_house', 'fedex', 'dhl', 'local_courier', etc.
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  
  -- Delivery type
  delivery_type TEXT DEFAULT 'standard', -- 'standard', 'express', 'white_glove', 'scheduled'
  
  -- Tracking
  tracking_number TEXT UNIQUE,
  current_status TEXT NOT NULL DEFAULT 'order_placed', 
  -- Statuses: 'order_placed', 'packing', 'packed', 'out_for_delivery', 
  --           'in_transit', 'nearby', 'delivered', 'failed', 'returned'
  
  -- Location tracking
  current_location TEXT,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  
  -- Delivery schedule
  estimated_delivery_date DATE,
  scheduled_delivery_date DATE,
  scheduled_time_slot TEXT, -- 'morning', 'afternoon', 'evening', or specific time
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Delivery address
  delivery_address TEXT NOT NULL,
  delivery_landmark TEXT,
  delivery_city TEXT,
  delivery_pincode TEXT,
  
  -- Special instructions
  special_instructions TEXT,
  access_code TEXT, -- For gated communities
  
  -- White-glove services (for furniture)
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
  
  -- Customer interaction
  delivery_attempts INTEGER DEFAULT 0,
  customer_not_available_count INTEGER DEFAULT 0,
  failed_delivery_reason TEXT,
  
  -- Proof of delivery
  delivery_signature_url TEXT,
  delivery_photo_urls TEXT[],
  received_by_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(current_status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_number ON delivery_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_date ON delivery_tracking(estimated_delivery_date);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_delivery_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_tracking_updated_at
  BEFORE UPDATE ON delivery_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_tracking_updated_at();

-- =====================================================
-- 5. DELIVERY STATUS HISTORY TABLE
-- =====================================================
-- Stores all status changes for complete tracking timeline
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_tracking_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE NOT NULL,
  
  -- Status change
  status TEXT NOT NULL,
  status_message TEXT,
  location TEXT,
  
  -- Additional info
  notes TEXT,
  updated_by_user_id UUID,
  updated_by_name TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_tracking ON delivery_status_history(delivery_tracking_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_date ON delivery_status_history(created_at);

-- =====================================================
-- 6. CUSTOM ORDER REQUESTS TABLE
-- =====================================================
-- Manages custom furniture orders with measurements
CREATE TABLE IF NOT EXISTS custom_order_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Product/Service details
  furniture_type TEXT NOT NULL, -- 'sofa', 'bed', 'wardrobe', 'dining_table', etc.
  description TEXT NOT NULL,
  reference_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Customization details
  material_preference TEXT,
  color_preference TEXT,
  finish_preference TEXT,
  style_preference TEXT, -- 'modern', 'traditional', 'minimalist', etc.
  
  -- Dimensions (for custom sizing)
  custom_dimensions TEXT, -- e.g., "200x180x90 cm (LxWxH)"
  room_dimensions TEXT,
  space_constraints TEXT,
  
  -- Reference images
  reference_image_urls TEXT[],
  room_photo_urls TEXT[],
  
  -- Measurement scheduling
  requires_measurement BOOLEAN DEFAULT true,
  measurement_address TEXT,
  preferred_measurement_date DATE,
  preferred_measurement_time TEXT,
  measurement_scheduled_date DATE,
  measurement_completed_date DATE,
  measurement_technician TEXT,
  measurement_notes TEXT,
  final_dimensions TEXT,
  
  -- Budget
  budget_range TEXT, -- e.g., "₹50,000 - ₹75,000"
  estimated_price DECIMAL(10, 2),
  quoted_price DECIMAL(10, 2),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', 
  -- 'pending', 'measurement_scheduled', 'measured', 'quote_sent', 
  -- 'quote_approved', 'in_production', 'ready', 'delivered', 'cancelled'
  
  -- Admin handling
  assigned_to_user_id UUID,
  assigned_to_name TEXT,
  admin_notes TEXT,
  
  -- Quote details
  quote_sent_date DATE,
  quote_valid_until DATE,
  quote_document_url TEXT,
  
  -- Order conversion
  converted_to_order BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Production timeline
  estimated_production_days INTEGER,
  production_start_date DATE,
  expected_completion_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_order_requests_customer ON custom_order_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_requests_status ON custom_order_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_order_requests_date ON custom_order_requests(created_at);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_custom_order_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_order_requests_updated_at
  BEFORE UPDATE ON custom_order_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_order_requests_updated_at();

-- =====================================================
-- 7. UPDATE EXISTING TABLES
-- =====================================================

-- Add variant support to cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cart_items_variant ON cart_items(product_variant_id);

-- Add variant support to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_sku TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(product_variant_id);

-- Add delivery tracking reference to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_tracking_id UUID REFERENCES delivery_tracking(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_white_glove BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_custom_order BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_order_request_id UUID REFERENCES custom_order_requests(id) ON DELETE SET NULL;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_order_requests ENABLE ROW LEVEL SECURITY;

-- Product Variants: Everyone can view available variants
CREATE POLICY "Allow viewing available variants" ON product_variants
  FOR SELECT USING (is_available = true);

-- Product Variants: Admins can manage
CREATE POLICY "Admins can manage variants" ON product_variants
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Inventory Adjustments: Admins only
CREATE POLICY "Admins can view inventory adjustments" ON inventory_adjustments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create inventory adjustments" ON inventory_adjustments
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Return Requests: Customers can view their own returns
CREATE POLICY "Customers can view own returns" ON return_requests
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Return Requests: Customers can create returns
CREATE POLICY "Customers can create returns" ON return_requests
  FOR INSERT WITH CHECK (true);

-- Return Requests: Admins can manage all returns
CREATE POLICY "Admins can manage returns" ON return_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Delivery Tracking: Customers can view their own delivery status
CREATE POLICY "Customers can view own delivery" ON delivery_tracking
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
    )
  );

-- Delivery Tracking: Allow creation and updates
CREATE POLICY "Allow delivery tracking operations" ON delivery_tracking
  FOR ALL USING (true) WITH CHECK (true);

-- Delivery Status History: Everyone can view for their orders
CREATE POLICY "Allow viewing delivery history" ON delivery_status_history
  FOR SELECT USING (true);

CREATE POLICY "Allow creating delivery history" ON delivery_status_history
  FOR INSERT WITH CHECK (true);

-- Custom Order Requests: Customers can view their own requests
CREATE POLICY "Customers can view own custom requests" ON custom_order_requests
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Custom Order Requests: Allow creation
CREATE POLICY "Allow custom request creation" ON custom_order_requests
  FOR INSERT WITH CHECK (true);

-- Custom Order Requests: Admins can manage all
CREATE POLICY "Admins can manage custom requests" ON custom_order_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to automatically create inventory adjustment when stock changes
CREATE OR REPLACE FUNCTION log_inventory_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if stock quantity changed
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
      CASE 
        WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'restock'
        ELSE 'manual_adjustment'
      END,
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

-- Function to update delivery tracking when status changes
CREATE OR REPLACE FUNCTION log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status changed
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
-- PHASE B SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Create admin pages for managing variants, inventory, and returns
-- 2. Build delivery board UI for tracking all deliveries
-- 3. Create customer-facing pages for returns and custom orders
-- 4. Implement white-glove service booking flow
-- 5. Add measurement scheduling functionality
