/*
  # Fix connection between auth.users and public.users

  1. Changes
    - Add auth_user_id column to public.users table to link with auth.users
    - Update existing demo user to link with auth user
    - Create function to automatically create public.users record when auth user is created
    - Create trigger to call this function

  2. Security
    - Maintain existing RLS policies
    - Add policy for users to read their own data based on auth.uid()
*/

-- Add auth_user_id column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON users(auth_user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create public.users record if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
    INSERT INTO public.users (
      id,
      auth_user_id,
      nome,
      email,
      senha,
      funcao,
      tenant_id,
      ativo
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'auth_managed', -- Password is managed by auth
      'user',
      (SELECT id FROM tenants LIMIT 1), -- Default tenant
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing demo user to link with auth user if exists
DO $$
DECLARE
  auth_user_id uuid;
  demo_user_id uuid;
BEGIN
  -- Find auth user with admin@demo.local email
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@demo.local' 
  LIMIT 1;
  
  -- Find public user with admin@demo.local email
  SELECT id INTO demo_user_id
  FROM public.users
  WHERE email = 'admin@demo.local'
  LIMIT 1;
  
  -- If both exist, link them
  IF auth_user_id IS NOT NULL AND demo_user_id IS NOT NULL THEN
    UPDATE public.users 
    SET auth_user_id = auth_user_id
    WHERE id = demo_user_id;
  END IF;
END $$;

-- Update RLS policies to use auth.uid()
DROP POLICY IF EXISTS "Users can read own tenant users" ON users;
DROP POLICY IF EXISTS "Users can update own tenant users" ON users;
DROP POLICY IF EXISTS "Users can insert own tenant users" ON users;
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public insert to users" ON users;
DROP POLICY IF EXISTS "Allow public update to users" ON users;

-- Create new RLS policies based on auth.uid()
CREATE POLICY "Users can read own data and tenant users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid() OR 
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "System can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
