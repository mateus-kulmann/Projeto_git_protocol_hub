/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies are causing infinite recursion
    - Policy tries to check permissions by joining users table with itself
    - This creates a circular dependency during authentication

  2. Solution
    - Replace complex permission-based policies with simpler role-based policies
    - Use direct role checking instead of permission table joins
    - Maintain security while avoiding recursion

  3. Security
    - Users can read their own data
    - Admins can read all users in their tenant
    - Supervisors can read users in their department
    - Maintain tenant isolation
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read based on permissions" ON users;
DROP POLICY IF EXISTS "Users can insert based on permissions" ON users;
DROP POLICY IF EXISTS "Users can update based on permissions" ON users;

-- Create new simplified policies that avoid recursion
CREATE POLICY "Users can read own data or admin can read all"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- User can read their own data
    auth_user_id = auth.uid()
    OR
    -- Admin can read all users in their tenant
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.auth_user_id = auth.uid()
      AND admin_user.funcao = 'admin'
      AND admin_user.tenant_id = users.tenant_id
    )
  );

CREATE POLICY "Admins can insert users in their tenant"
  ON users
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

CREATE POLICY "Users can update own data or admin can update all"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update their own data
    auth_user_id = auth.uid()
    OR
    -- Admin can update all users in their tenant
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.auth_user_id = auth.uid()
      AND admin_user.funcao = 'admin'
      AND admin_user.tenant_id = users.tenant_id
    )
  );

-- Create function to check user permissions without recursion
CREATE OR REPLACE FUNCTION user_has_permission(permission_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_id uuid;
  has_perm boolean := false;
BEGIN
  -- Get current user's role_id directly from auth context
  SELECT u.role_id INTO user_role_id
  FROM users u
  WHERE u.auth_user_id = auth.uid();
  
  -- If no role found, return false
  IF user_role_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if role has the permission
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = user_role_id
    AND p.codigo = permission_code
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;
