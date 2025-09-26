/*
  # Fix connection between auth.users and public.users

  1. Schema Changes
    - Add `auth_user_id` column to `users` table to link with auth.users
    - Create function to automatically create public user when auth user is created
    - Update RLS policies to use auth.uid()

  2. Data Migration
    - Link existing demo user to auth user if both exist

  3. Security
    - Update RLS policies to properly use auth.uid()
    - Ensure proper access control
*/

-- Add auth_user_id column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
    CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_key ON public.users(auth_user_id);
  END IF;
END $$;

-- Function to create public user when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, nome, email, funcao, tenant_id, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'agent',
    (SELECT id FROM public.tenants WHERE dominio = 'demo.local' LIMIT 1),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to use auth.uid()
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert to users" ON public.users;
DROP POLICY IF EXISTS "Allow public update to users" ON public.users;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Update other table policies to use proper auth checks
DROP POLICY IF EXISTS "Users can read own tenant protocols" ON public.protocols;
DROP POLICY IF EXISTS "Users can insert own tenant protocols" ON public.protocols;
DROP POLICY IF EXISTS "Users can update own tenant protocols" ON public.protocols;

CREATE POLICY "Users can read protocols from their tenant" ON public.protocols
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert protocols to their tenant" ON public.protocols
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update protocols from their tenant" ON public.protocols
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Update departments policies
DROP POLICY IF EXISTS "Users can read own tenant departments" ON public.departments;
DROP POLICY IF EXISTS "Users can insert own tenant departments" ON public.departments;
DROP POLICY IF EXISTS "Users can update own tenant departments" ON public.departments;

CREATE POLICY "Users can read departments from their tenant" ON public.departments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert departments to their tenant" ON public.departments
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update departments from their tenant" ON public.departments
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Update categories policies
DROP POLICY IF EXISTS "Users can read own tenant categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own tenant categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own tenant categories" ON public.categories;

CREATE POLICY "Users can read categories from their tenant" ON public.categories
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories to their tenant" ON public.categories
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories from their tenant" ON public.categories
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Link existing demo user to auth user if both exist
DO $$
DECLARE
  demo_user_id uuid;
  demo_auth_user_id uuid;
BEGIN
  -- Find existing demo user in public.users
  SELECT id INTO demo_user_id
  FROM public.users 
  WHERE email = 'admin@demo.local' 
  LIMIT 1;
  
  -- Find existing demo user in auth.users
  SELECT id INTO demo_auth_user_id
  FROM auth.users 
  WHERE email = 'admin@demo.local' 
  LIMIT 1;
  
  -- Link them if both exist
  IF demo_user_id IS NOT NULL AND demo_auth_user_id IS NOT NULL THEN
    UPDATE public.users 
    SET auth_user_id = demo_auth_user_id
    WHERE id = demo_user_id;
  END IF;
END $$;
