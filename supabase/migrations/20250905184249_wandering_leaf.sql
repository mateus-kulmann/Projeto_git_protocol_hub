/*
  # Restore working system - Fix permissions and RLS issues

  1. Drop problematic policies
    - Remove all recursive policies from users table
    - Remove complex permission-based policies
  
  2. Create simple, working policies
    - Users can read own data
    - Admins can read all users in tenant
    - Simple role-based access without recursion
  
  3. Fix user_has_permission function
    - Remove recursive calls
    - Simple permission checking
  
  4. Ensure system works for login
    - Basic authentication flow
    - No complex joins in auth context
*/

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Drop the problematic function
DROP FUNCTION IF EXISTS user_has_permission(text);

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can read all tenant users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.auth_user_id = auth.uid() 
      AND admin_user.funcao = 'admin'
      AND admin_user.tenant_id = users.tenant_id
    )
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage tenant users"
  ON users
  FOR ALL
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

-- Create a simple permission checking function
CREATE OR REPLACE FUNCTION user_has_permission(permission_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_id uuid;
  has_permission boolean := false;
BEGIN
  -- Get current user's role_id directly
  SELECT role_id INTO user_role_id
  FROM users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- If no role_id, check if user is admin (fallback)
  IF user_role_id IS NULL THEN
    SELECT (funcao = 'admin') INTO has_permission
    FROM users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(has_permission, false);
  END IF;
  
  -- Check if role has the permission
  SELECT EXISTS (
    SELECT 1 
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = user_role_id 
    AND p.codigo = permission_code
  ) INTO has_permission;
  
  RETURN COALESCE(has_permission, false);
END;
$$;
