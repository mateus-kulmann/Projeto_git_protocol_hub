/*
  # Fix audit tables and functions

  1. Drop and recreate tables with correct structure
  2. Add missing comment column
  3. Fix log_protocol_action function
  4. Ensure proper RLS policies
*/

-- Drop existing objects to recreate them correctly
DROP FUNCTION IF EXISTS log_protocol_action(uuid, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS log_audit_view(uuid, uuid, text);
DROP TABLE IF EXISTS protocol_audit_views CASCADE;
DROP TABLE IF EXISTS protocol_audit_log CASCADE;

-- Create protocol_audit_log table with correct structure
CREATE TABLE protocol_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action_type text NOT NULL,
  action_description text NOT NULL,
  old_value text,
  new_value text,
  comment text, -- This column was missing
  created_at timestamptz DEFAULT now()
);

-- Create protocol_audit_views table
CREATE TABLE protocol_audit_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid REFERENCES protocol_audit_log(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  user_type text DEFAULT 'internal',
  viewed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE protocol_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_audit_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for protocol_audit_log
CREATE POLICY "Users can read audit logs" ON protocol_audit_log
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert audit logs" ON protocol_audit_log
  FOR INSERT TO public WITH CHECK (true);

-- Create RLS policies for protocol_audit_views
CREATE POLICY "Users can read audit views" ON protocol_audit_views
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert audit views" ON protocol_audit_views
  FOR INSERT TO public WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_protocol_audit_log_protocol_id ON protocol_audit_log(protocol_id);
CREATE INDEX idx_protocol_audit_log_created_at ON protocol_audit_log(created_at);
CREATE INDEX idx_protocol_audit_views_audit_log_id ON protocol_audit_views(audit_log_id);

-- Create the log_protocol_action function with correct parameters
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

-- Create the log_audit_view function
CREATE OR REPLACE FUNCTION log_audit_view(
  p_audit_log_id uuid,
  p_user_id uuid,
  p_user_type text DEFAULT 'internal'
) RETURNS uuid AS $$
DECLARE
  view_id uuid;
BEGIN
  -- Check if this user already viewed this audit entry
  IF NOT EXISTS (
    SELECT 1 FROM protocol_audit_views 
    WHERE audit_log_id = p_audit_log_id AND user_id = p_user_id
  ) THEN
    INSERT INTO protocol_audit_views (
      audit_log_id,
      user_id,
      user_type
    ) VALUES (
      p_audit_log_id,
      p_user_id,
      p_user_type
    ) RETURNING id INTO view_id;
  END IF;
  
  RETURN view_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
