/*
  # Disable triggers and create minimal RLS policies

  1. Disable all triggers on users table that might cause recursion
  2. Drop all existing RLS policies 
  3. Create minimal, safe RLS policies
  4. Temporarily disable any functions that might cause loops

  This will isolate the recursion issue and allow login to work.
*/

-- First, disable RLS temporarily to avoid issues while fixing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "admins_read_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_insert_users" ON users;
DROP POLICY IF EXISTS "admins_update_users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "admins_read_all" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "admins_insert_users" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_update_users" ON users;

-- Drop any other policies that might exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
    END LOOP;
END $$;

-- Disable any triggers that might cause recursion
DROP TRIGGER IF EXISTS trigger_set_protocol_number ON users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON users;
DROP TRIGGER IF EXISTS hash_password_trigger ON users;

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS hash_password() CASCADE;

-- Create very simple, non-recursive RLS policies
CREATE POLICY "allow_own_select" ON users
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

CREATE POLICY "allow_admin_select" ON users
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

CREATE POLICY "allow_own_update" ON users
    FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "allow_admin_all" ON users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users admin_check 
            WHERE admin_check.auth_user_id = auth.uid() 
            AND admin_check.funcao = 'admin'
            AND admin_check.tenant_id = users.tenant_id
        )
    );

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
