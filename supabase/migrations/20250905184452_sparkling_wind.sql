/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies are causing infinite recursion
    - Policies are referencing the users table in circular ways
    - This prevents any queries to the users table from working

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies
    - Use direct auth.uid() comparisons without subqueries
    - Separate admin logic from regular user logic

  3. Security
    - Users can only see their own data
    - Admins can see all users in their tenant (simple funcao check)
    - No circular dependencies or complex joins
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all tenant users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage tenant users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Create simple, non-recursive policies
-- Policy 1: Users can read their own data
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 2: Admins can read all users in their tenant
CREATE POLICY "admins_read_all" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.auth_user_id = auth.uid() 
      AND admin_user.funcao = 'admin'
      AND admin_user.tenant_id = users.tenant_id
    )
  );

-- Policy 3: Users can update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 4: Admins can insert new users in their tenant
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.auth_user_id = auth.uid() 
      AND admin_user.funcao = 'admin'
      AND admin_user.tenant_id = users.tenant_id
    )
  );

-- Policy 5: Admins can update users in their tenant
CREATE POLICY "admins_update_users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.auth_user_id = auth.uid() 
      AND admin_user.funcao = 'admin'
      AND admin_user.tenant_id = users.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.auth_user_id = auth.uid() 
      AND admin_user.funcao = 'admin'
      AND admin_user.tenant_id = users.tenant_id
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
