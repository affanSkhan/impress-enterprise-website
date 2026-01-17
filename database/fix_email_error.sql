-- Fix for "null value in column 'email' violates not-null constraint"
-- This script makes the email column optional since we are using phone-based auth.
-- Run this in the Supabase SQL Editor.

ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
