-- Script to clear test invoice and order data
-- Run this in Supabase SQL Editor to remove test data

-- WARNING: This will permanently delete invoice and order data
-- Make sure you want to proceed before running this script

-- ==============================================
-- CLEAR INVOICES
-- ==============================================

-- Option 1: Delete ALL invoices (use with caution)
-- Uncomment the lines below to delete all invoices
-- DELETE FROM invoice_items;
-- DELETE FROM invoices;

-- Option 2: Delete invoices from a specific date range (safer)
-- Uncomment and modify the date range below
-- DELETE FROM invoice_items 
-- WHERE invoice_id IN (
--   SELECT id FROM invoices 
--   WHERE date >= '2025-12-01' AND date < '2025-12-22'
-- );
-- DELETE FROM invoices 
-- WHERE date >= '2025-12-01' AND date < '2025-12-22';

-- Option 3: Delete invoices with specific invoice numbers (most precise)
-- Example: Delete test invoices INV-001, INV-002, etc.
-- DELETE FROM invoice_items 
-- WHERE invoice_id IN (
--   SELECT id FROM invoices 
--   WHERE invoice_number LIKE 'INV-%'
-- );
-- DELETE FROM invoices 
-- WHERE invoice_number LIKE 'INV-%';

-- ==============================================
-- CLEAR ORDERS
-- ==============================================

-- Option 1: Delete ALL orders (use with caution)
-- Uncomment the lines below to delete all orders
-- DELETE FROM order_items;
-- DELETE FROM orders;

-- Option 2: Delete orders from a specific date range (safer)
-- Uncomment and modify the date range below
-- DELETE FROM order_items 
-- WHERE order_id IN (
--   SELECT id FROM orders 
--   WHERE created_at >= '2025-12-01' AND created_at < '2025-12-22'
-- );
-- DELETE FROM orders 
-- WHERE created_at >= '2025-12-01' AND created_at < '2025-12-22';

-- Option 3: Delete orders with specific statuses (e.g., test orders marked as cancelled)
-- DELETE FROM order_items 
-- WHERE order_id IN (
--   SELECT id FROM orders 
--   WHERE status = 'cancelled' OR notes LIKE '%test%'
-- );
-- DELETE FROM orders 
-- WHERE status = 'cancelled' OR notes LIKE '%test%';

-- ==============================================
-- PREVIEW DATA BEFORE DELETING (Run this first!)
-- ==============================================

-- Preview invoices
SELECT 
  'INVOICES' as data_type,
  id,
  invoice_number,
  customer_name,
  customer_phone,
  date,
  total,
  created_at
FROM invoices
ORDER BY created_at DESC;

-- Preview orders
SELECT 
  'ORDERS' as data_type,
  id,
  order_number,
  customer_id,
  status,
  total,
  created_at
FROM orders
ORDER BY created_at DESC;

-- Count of records
SELECT 
  (SELECT COUNT(*) FROM invoice_items) as total_invoice_items,
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COUNT(*) FROM order_items) as total_order_items,
  (SELECT COUNT(*) FROM orders) as total_orders;

-- ==============================================
-- QUICK DELETE ALL TEST DATA (DANGER!)
-- ==============================================
-- Uncomment ONLY if you want to delete EVERYTHING
-- This will clear all invoices and orders

-- DELETE FROM invoice_items;
-- DELETE FROM invoices;
-- DELETE FROM order_items;
-- DELETE FROM orders;

-- Verify deletion
-- SELECT 
--   (SELECT COUNT(*) FROM invoice_items) as invoice_items_left,
--   (SELECT COUNT(*) FROM invoices) as invoices_left,
--   (SELECT COUNT(*) FROM order_items) as order_items_left,
--   (SELECT COUNT(*) FROM orders) as orders_left;

