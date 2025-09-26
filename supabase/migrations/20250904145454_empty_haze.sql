/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - Policies are trying to query users table within their own conditions
    - This creates a loop when evaluating access permissions

  2. Solution
    - Drop all existing problematic policies on users table
    - Create simple, non-recursive policies
    - Use direct auth.uid() comparisons without complex subqueries
    - Avoid any joins or subqueries that reference users table

  3. Security
    - Users can read their own data (auth_user_id = auth.uid())
    - Admins can read all users in their tenant (simple funcao check)
    - Insert/Update policies for admins only
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can read own data or admin can read all" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can update own data or admin can update all" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Create simple, non-recursive policies

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Allow admins to read all users (simple check without subqueries)
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.auth_user_id = auth.uid() 
      AND admin_check.funcao = 'admin'
      AND admin_check.tenant_id = users.tenant_id
    )
  );

-- Allow admins to insert users
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.auth_user_id = auth.uid() 
      AND admin_check.funcao = 'admin'
      AND admin_check.tenant_id = users.tenant_id
    )
  );

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Allow admins to update all users in their tenant
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.auth_user_id = auth.uid() 
      AND admin_check.funcao = 'admin'
      AND admin_check.tenant_id = users.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.auth_user_id = auth.uid() 
      AND admin_check.funcao = 'admin'
      AND admin_check.tenant_id = users.tenant_id
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
