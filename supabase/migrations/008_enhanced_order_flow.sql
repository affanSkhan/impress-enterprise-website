-- Enhanced Order Flow Migration - Updated for TEXT status column
-- Adds payment tracking, quotation tracking, and cancellation support
-- Date: 2025-12-04

-- =====================================================
-- UPDATE ORDER STATUS CHECK CONSTRAINT
-- =====================================================
-- Update the CHECK constraint to include new statuses

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'quotation_sent', 'quote_approved', 'payment_pending', 'payment_received', 'ready_for_pickup', 'completed'));

-- =====================================================
-- 2. ADD PAYMENT TRACKING FIELDS
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES auth.users(id);

-- Add comments for clarity
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: cash, upi, card, online, bank_transfer';
COMMENT ON COLUMN orders.payment_reference IS 'UPI transaction ID, payment gateway reference, or bank reference number';
COMMENT ON COLUMN orders.payment_amount IS 'Actual amount paid by customer';

-- =====================================================
-- 3. ADD QUOTATION TRACKING FIELDS
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS quotation_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quotation_sent_via VARCHAR(20) DEFAULT 'whatsapp';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quotation_sent_by UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quote_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quote_approved_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN orders.quotation_sent_via IS 'Method used to send quotation: whatsapp, email, sms, manual';

-- =====================================================
-- 4. ADD CANCELLATION TRACKING FIELDS
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by_type VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

COMMENT ON COLUMN orders.cancelled_by_type IS 'Who cancelled: customer or admin';

-- Create index for cancelled orders
CREATE INDEX IF NOT EXISTS idx_orders_is_cancelled ON orders(is_cancelled) WHERE is_cancelled = TRUE;

-- =====================================================
-- 5. ADD ADMIN TOTAL COLUMN TO ORDERS
-- =====================================================

-- Add admin_total at order level for easier queries
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_total DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN orders.admin_total IS 'Total amount calculated from order_items.admin_total';

-- =====================================================
-- 6. CREATE FUNCTION TO CALCULATE ORDER TOTAL
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(admin_total), 0) INTO total
  FROM order_items
  WHERE order_id = order_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE TRIGGER TO UPDATE ORDER TOTAL
-- =====================================================

CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET admin_total = calculate_order_total(NEW.order_id)
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_order_total ON order_items;

-- Create trigger on order_items
CREATE TRIGGER trigger_update_order_total
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- =====================================================
-- 8. CREATE FUNCTION FOR ORDER CANCELLATION
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_order(
  order_uuid UUID,
  cancelled_by UUID,
  cancelled_type VARCHAR(20),
  reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE orders
  SET 
    is_cancelled = TRUE,
    cancelled_at = NOW(),
    cancelled_by_id = cancelled_by,
    cancelled_by_type = cancelled_type,
    cancellation_reason = reason,
    status = 'cancelled'
  WHERE id = order_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. UPDATE NOTIFICATION TRIGGERS FOR NEW STATUSES
-- =====================================================

-- Update the existing notify_order_status_change function to handle new statuses
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_type VARCHAR(20);
  notification_title VARCHAR(255);
  notification_message TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determine notification type and content based on status
    CASE NEW.status
      WHEN 'quotation_sent' THEN
        notification_type := 'info';
        notification_title := 'Quotation Sent';
        notification_message := 'Your quotation for Order #' || NEW.order_number || ' has been sent. Please check WhatsApp.';
      WHEN 'quote_approved' THEN
        notification_type := 'success';
        notification_title := 'Quote Approved';
        notification_message := 'Quote for Order #' || NEW.order_number || ' has been approved by customer.';
      WHEN 'payment_pending' THEN
        notification_type := 'warning';
        notification_title := 'Payment Pending';
        notification_message := 'Order #' || NEW.order_number || ' is awaiting payment confirmation.';
      WHEN 'payment_received' THEN
        notification_type := 'success';
        notification_title := 'Payment Received';
        notification_message := 'Payment received for Order #' || NEW.order_number || '. Invoice generated.';
      WHEN 'processing' THEN
        notification_type := 'info';
        notification_title := 'Order Processing';
        notification_message := 'Order #' || NEW.order_number || ' is being processed.';
      WHEN 'ready_for_pickup' THEN
        notification_type := 'success';
        notification_title := 'Ready for Pickup';
        notification_message := 'Order #' || NEW.order_number || ' is ready for pickup!';
      WHEN 'completed' THEN
        notification_type := 'success';
        notification_title := 'Order Completed';
        notification_message := 'Order #' || NEW.order_number || ' has been completed. Thank you!';
      WHEN 'cancelled' THEN
        notification_type := 'error';
        notification_title := 'Order Cancelled';
        notification_message := 'Order #' || NEW.order_number || ' has been cancelled.';
      WHEN 'invoiced' THEN
        notification_type := 'success';
        notification_title := 'Invoice Generated';
        notification_message := 'Invoice generated for Order #' || NEW.order_number;
      ELSE
        notification_type := 'info';
        notification_title := 'Order Status Updated';
        notification_message := 'Order #' || NEW.order_number || ' status changed to ' || NEW.status;
    END CASE;

    -- Insert admin notification (notifications table is admin-only)
    -- Note: Customer notifications would need a separate customer_notifications table
    INSERT INTO notifications (
      title,
      message,
      type,
      category,
      link,
      metadata
    )
    VALUES (
      notification_title,
      notification_message,
      notification_type,
      'order',
      '/admin/orders/' || NEW.id,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'customer_id', NEW.customer_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. UPDATE RLS POLICIES
-- =====================================================

-- Allow admins to update payment fields
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'staff')
    )
  );

-- Allow customers to view their cancelled orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 11. BACKFILL ADMIN_TOTAL FOR EXISTING ORDERS
-- =====================================================

-- Update existing orders with calculated totals
UPDATE orders o
SET admin_total = (
  SELECT COALESCE(SUM(oi.admin_total), 0)
  FROM order_items oi
  WHERE oi.order_id = o.id
)
WHERE admin_total = 0 OR admin_total IS NULL;

-- =====================================================
-- 12. CREATE HELPFUL VIEWS
-- =====================================================

-- View for active orders (non-cancelled)
CREATE OR REPLACE VIEW active_orders AS
SELECT * FROM orders
WHERE is_cancelled = FALSE
ORDER BY created_at DESC;

-- View for pending payment orders
CREATE OR REPLACE VIEW pending_payment_orders AS
SELECT 
  o.*
FROM orders o
WHERE o.status IN ('payment_pending', 'quote_approved')
  AND o.is_cancelled = FALSE
ORDER BY o.created_at DESC;

-- View for orders ready for pickup
CREATE OR REPLACE VIEW ready_orders AS
SELECT 
  o.*
FROM orders o
WHERE o.status = 'ready_for_pickup'
  AND o.is_cancelled = FALSE
ORDER BY o.updated_at DESC;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- New features added:
-- 1. Enhanced order statuses (12 total)
-- 2. Payment tracking and verification
-- 3. Quotation tracking
-- 4. Order cancellation support
-- 5. Automatic order total calculation
-- 6. Updated notifications for all statuses
-- 7. Helpful views for order management
-- =====================================================
