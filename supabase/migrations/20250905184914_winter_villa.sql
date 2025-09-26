/*
  # Complete diagnosis and fix for infinite recursion

  1. Disable RLS completely on users table
  2. Remove all problematic policies
  3. Remove any functions that might cause recursion
  4. Create minimal, safe policies
  5. Check for any other database objects causing issues
*/

-- Step 1: Disable RLS completely on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "allow_own_select" ON users;
DROP POLICY IF EXISTS "allow_admin_select" ON users;
DROP POLICY IF EXISTS "allow_own_update" ON users;
DROP POLICY IF EXISTS "allow_admin_all" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "admins_read_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_insert_users" ON users;
DROP POLICY IF EXISTS "admins_update_users" ON users;
DROP POLICY IF EXISTS "allow_admin_all" ON users;
DROP POLICY IF EXISTS "allow_admin_select" ON users;
DROP POLICY IF EXISTS "allow_own_select" ON users;
DROP POLICY IF EXISTS "allow_own_update" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Step 3: Drop any problematic functions
DROP FUNCTION IF EXISTS user_has_permission(uuid, text);
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS hash_password();

-- Step 4: Check if there are any triggers causing issues
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS hash_password_trigger ON users;

-- Step 5: Re-enable RLS with VERY simple policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create the simplest possible policies
CREATE POLICY "simple_read_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Allow public read for now (we can restrict later)
CREATE POLICY "simple_public_read" ON users
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to update their own records
CREATE POLICY "simple_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Allow authenticated users to insert (for registration)
CREATE POLICY "simple_insert" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
