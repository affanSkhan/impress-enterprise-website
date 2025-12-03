-- Migration: Enable Public Access to Invoices
-- Description: Allows customers to view invoices via public links
-- Created: 2025-12-03

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can manage invoice items" ON invoice_items;

-- Create new policies for invoices
-- Public can view invoices (for public invoice sharing)
CREATE POLICY "Public can view invoices" ON invoices
  FOR SELECT USING (true);

-- Admins can insert, update, delete invoices
CREATE POLICY "Admins can insert invoices" ON invoices
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can update invoices" ON invoices
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can delete invoices" ON invoices
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

-- Create new policies for invoice_items
-- Public can view invoice items (for public invoice sharing)
CREATE POLICY "Public can view invoice items" ON invoice_items
  FOR SELECT USING (true);

-- Admins can insert, update, delete invoice items
CREATE POLICY "Admins can insert invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can update invoice items" ON invoice_items
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can delete invoice items" ON invoice_items
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
  );
