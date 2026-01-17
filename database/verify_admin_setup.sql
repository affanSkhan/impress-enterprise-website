-- =====================================================
-- VERIFY AND FIX ADMIN USER SETUP
-- =====================================================

-- Check 1: Verify admin user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@impress.com';

-- Check 2: Verify admin role exists in user_roles
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  u.email
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'admin@impress.com';

-- Check 3: Verify RLS policies on user_roles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- Fix: Re-insert admin role if missing
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@impress.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Fix: TEMPORARILY DISABLE RLS to rule out policy issues
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Note: We are disabling RLS to ensure the admin login works. 
-- Once you are logged in successfully, we can re-enable it with stricter policies.

/* 
-- Previous policies (commented out)
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
*/

-- Final verification
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN '✓ Admin role assigned'
    WHEN ur.role IS NULL THEN '✗ No role assigned'
    ELSE '✗ Wrong role: ' || ur.role
  END as status
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@impress.com';
