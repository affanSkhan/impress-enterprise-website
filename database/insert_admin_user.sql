-- =====================================================
-- INSERT ADMIN USER CREDENTIALS
-- Email: admin@impress.com
-- Password: Munavvar@1137
-- =====================================================
-- IMPORTANT: Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Step 1: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_role UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Step 2: Delete existing admin user if exists
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'admin@impress.com';

  IF existing_user_id IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = existing_user_id;
    RAISE NOTICE 'Deleted existing admin role';
  END IF;
END $$;

-- Step 3: Create admin user using Supabase auth
-- You need to sign up the user first, then run Step 4
-- OR use the Supabase Dashboard: Authentication > Users > Add User
-- Email: admin@impress.com
-- Password: Munavvar@1137
-- Email Confirmed: YES (check this box)

-- Step 4: Insert admin role for the user
-- Run this AFTER creating the user in Step 3
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@impress.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Step 5: Enable RLS and create policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Public read access" ON user_roles;

-- Allow users to read their own role
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Allow service role to manage roles (for login checks)
CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL
  USING (true);

-- Step 6: Verify the admin user was created
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@impress.com';

-- If you see the admin user with role 'admin', everything is set up correctly!

-- Step 5: Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin user created successfully!';
  RAISE NOTICE 'Email: admin@impress.com';
  RAISE NOTICE 'Password: Munavvar@1137';
  RAISE NOTICE 'You can now login at /admin/login';
  RAISE NOTICE '========================================';
END $$;
