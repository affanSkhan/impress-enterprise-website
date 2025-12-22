-- Migration: Add recipient fields to notifications table
-- This allows notifications to be targeted to specific users/customers

-- Add recipient fields
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS recipient_id UUID;

-- Add comments for clarity
COMMENT ON COLUMN notifications.recipient_type IS 'Type of recipient: admin, customer, or all';
COMMENT ON COLUMN notifications.recipient_id IS 'Specific user/customer ID, NULL for broadcast to all of that type';

-- Create indexes for recipient filtering
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_combo ON notifications(recipient_type, recipient_id);

-- Update existing notifications to be admin-targeted
UPDATE notifications 
SET recipient_type = 'admin'
WHERE recipient_type IS NULL;

-- Update the notify_new_order function to also notify customer
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  customer_name_var VARCHAR(255);
BEGIN
  -- Get customer name from customers table
  SELECT name INTO customer_name_var
  FROM customers
  WHERE id = NEW.customer_id;

  -- Notify admin
  INSERT INTO notifications (title, message, type, category, link, metadata, recipient_type, recipient_id)
  VALUES (
    'New Order Received',
    'Order #' || NEW.order_number || ' has been placed' || 
    CASE WHEN customer_name_var IS NOT NULL THEN ' by ' || customer_name_var ELSE '' END,
    'info',
    'order',
    '/admin/orders/' || NEW.id,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'customer_name', customer_name_var
    ),
    'admin',
    NULL
  );

  -- Notify customer
  INSERT INTO notifications (title, message, type, category, link, metadata, recipient_type, recipient_id)
  VALUES (
    'Order Placed Successfully',
    'Your order #' || NEW.order_number || ' has been received and is being reviewed',
    'success',
    'order',
    '/customer/orders/' || NEW.id,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number
    ),
    'customer',
    NEW.customer_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the notify_order_status_change function to notify customer
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_name_var VARCHAR(255);
  notification_title VARCHAR(255);
  notification_message TEXT;
  notification_type VARCHAR(50);
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get customer name
  SELECT name INTO customer_name_var
  FROM customers
  WHERE id = NEW.customer_id;

  -- Set notification content based on new status
  CASE NEW.status
    WHEN 'approved' THEN
      notification_title := 'Order Approved';
      notification_message := 'Order #' || NEW.order_number || ' has been approved';
      notification_type := 'success';
    WHEN 'invoiced' THEN
      notification_title := 'Invoice Generated';
      notification_message := 'Invoice has been generated for order #' || NEW.order_number;
      notification_type := 'success';
    WHEN 'completed' THEN
      notification_title := 'Order Completed';
      notification_message := 'Order #' || NEW.order_number || ' has been completed. Thank you!';
      notification_type := 'success';
    WHEN 'cancelled' THEN
      notification_title := 'Order Cancelled';
      notification_message := 'Order #' || NEW.order_number || ' has been cancelled';
      notification_type := 'error';
    ELSE
      notification_title := 'Order Status Updated';
      notification_message := 'Order #' || NEW.order_number || ' status changed to ' || NEW.status;
      notification_type := 'info';
  END CASE;

  -- Notify admin
  INSERT INTO notifications (title, message, type, category, link, metadata, recipient_type, recipient_id)
  VALUES (
    notification_title,
    notification_message || CASE WHEN customer_name_var IS NOT NULL THEN ' (Customer: ' || customer_name_var || ')' ELSE '' END,
    notification_type,
    'order',
    '/admin/orders/' || NEW.id,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'customer_name', customer_name_var
    ),
    'admin',
    NULL
  );

  -- Notify customer
  INSERT INTO notifications (title, message, type, category, link, metadata, recipient_type, recipient_id)
  VALUES (
    notification_title,
    notification_message,
    notification_type,
    'order',
    '/customer/orders/' || NEW.id,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'old_status', OLD.status,
      'new_status', NEW.status
    ),
    'customer',
    NEW.customer_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the notify_new_invoice function to notify customer
CREATE OR REPLACE FUNCTION notify_new_invoice()
RETURNS TRIGGER AS $$
DECLARE
  order_data RECORD;
BEGIN
  -- Get order details if invoice is linked to an order
  IF NEW.invoice_id IS NOT NULL THEN
    SELECT o.customer_id, o.order_number INTO order_data
    FROM orders o
    WHERE o.invoice_id = NEW.id
    LIMIT 1;
  END IF;

  -- Notify admin
  INSERT INTO notifications (title, message, type, category, link, metadata, recipient_type, recipient_id)
  VALUES (
    'New Invoice Created',
    'Invoice #' || NEW.invoice_number || ' has been created for ' || COALESCE(NEW.customer_name, 'a customer'),
    'success',
    'invoice',
    '/admin/invoices/' || NEW.id,
    jsonb_build_object(
      'invoice_id', NEW.id,
      'invoice_number', NEW.invoice_number,
      'customer_name', NEW.customer_name,
      'total_amount', NEW.total
    ),
    'admin',
    NULL
  );

  -- Notify customer if linked to order
  IF order_data.customer_id IS NOT NULL THEN
    INSERT INTO notifications (title, message, type, category, link, metadata, recipient_type, recipient_id)
    VALUES (
      'Invoice Ready',
      'Your invoice #' || NEW.invoice_number || ' is ready for order #' || COALESCE(order_data.order_number, ''),
      'success',
      'invoice',
      '/invoices/' || NEW.id,
      jsonb_build_object(
        'invoice_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'order_number', order_data.order_number,
        'total_amount', NEW.total
      ),
      'customer',
      order_data.customer_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin can see all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
    OR recipient_type = 'admin'
  );

-- Customers can see their own notifications
CREATE POLICY "Customers can view their notifications" ON notifications
  FOR SELECT
  USING (
    recipient_type = 'customer' 
    AND recipient_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Customers can see broadcast notifications
CREATE POLICY "Customers can view broadcast notifications" ON notifications
  FOR SELECT
  USING (
    recipient_type = 'all'
  );

-- Admin can manage notifications
CREATE POLICY "Admins can manage notifications" ON notifications
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Customers can update their own notifications (mark as read)
CREATE POLICY "Customers can update their notifications" ON notifications
  FOR UPDATE
  USING (
    recipient_type = 'customer' 
    AND recipient_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Grant permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Migration complete
