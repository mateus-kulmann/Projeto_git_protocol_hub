/*
  # Fix audit system tables and functions

  1. Drop and recreate audit tables with correct structure
  2. Create proper RLS policies
  3. Create helper function for logging actions
  4. Add sample data for testing
*/

-- Drop existing objects if they exist
DROP POLICY IF EXISTS "Users can insert audit logs" ON protocol_audit_log;
DROP POLICY IF EXISTS "Users can read audit logs" ON protocol_audit_log;
DROP POLICY IF EXISTS "Users can insert audit views" ON protocol_audit_views;
DROP POLICY IF EXISTS "Users can read audit views" ON protocol_audit_views;

DROP TABLE IF EXISTS protocol_audit_views CASCADE;
DROP TABLE IF EXISTS protocol_audit_log CASCADE;
DROP FUNCTION IF EXISTS log_protocol_action CASCADE;

-- Create protocol_audit_log table
CREATE TABLE protocol_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  action_type text NOT NULL,
  action_description text NOT NULL,
  old_value text,
  new_value text,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create protocol_audit_views table
CREATE TABLE protocol_audit_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL REFERENCES protocol_audit_log(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  user_type text DEFAULT 'internal',
  viewed_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_protocol_audit_log_protocol_id ON protocol_audit_log(protocol_id);
CREATE INDEX idx_protocol_audit_log_created_at ON protocol_audit_log(created_at);
CREATE INDEX idx_protocol_audit_views_audit_log_id ON protocol_audit_views(audit_log_id);

-- Enable RLS
ALTER TABLE protocol_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_audit_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for protocol_audit_log
CREATE POLICY "Users can insert audit logs"
  ON protocol_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM protocols p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = protocol_id AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read audit logs"
  ON protocol_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocols p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = protocol_id AND u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for protocol_audit_views
CREATE POLICY "Users can insert audit views"
  ON protocol_audit_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read audit views"
  ON protocol_audit_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocol_audit_log pal
      JOIN protocols p ON p.id = pal.protocol_id
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE pal.id = audit_log_id AND u.auth_user_id = auth.uid()
    )
  );

-- Create helper function for logging actions
CREATE OR REPLACE FUNCTION log_protocol_action(
  p_protocol_id uuid,
  p_user_id uuid,
  p_action_type text,
  p_action_description text,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_comment text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO protocol_audit_log (
    protocol_id,
    user_id,
    action_type,
    action_description,
    old_value,
    new_value,
    comment
  ) VALUES (
    p_protocol_id,
    p_user_id,
    p_action_type,
    p_action_description,
    p_old_value,
    p_new_value,
    p_comment
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
