/*
  # Create audit tables for protocol tramitação system

  1. New Tables
    - `protocol_audit_log`
      - `id` (uuid, primary key)
      - `protocol_id` (uuid, foreign key to protocols)
      - `user_id` (uuid, foreign key to users)
      - `action_type` (text - status_change, assignment, forward, etc.)
      - `action_description` (text - human readable description)
      - `old_value` (text - previous value)
      - `new_value` (text - new value)
      - `comment` (text - user comment)
      - `user_agent` (text - browser info)
      - `created_at` (timestamp)

    - `protocol_audit_views`
      - `id` (uuid, primary key)
      - `audit_log_id` (uuid, foreign key to protocol_audit_log)
      - `user_id` (uuid, foreign key to users)
      - `viewed_at` (timestamp)
      - `user_type` (text - internal/external)

  2. Security
    - Enable RLS on both tables
    - Add policies for appropriate access

  3. Functions
    - Helper functions for logging actions and views
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert audit logs" ON protocol_audit_log;
DROP POLICY IF EXISTS "Users can read audit logs" ON protocol_audit_log;
DROP POLICY IF EXISTS "Users can insert audit views" ON protocol_audit_views;
DROP POLICY IF EXISTS "Users can read audit views" ON protocol_audit_views;

-- Create protocol_audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS protocol_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action_type text NOT NULL,
  action_description text NOT NULL,
  old_value text,
  new_value text,
  comment text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create protocol_audit_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS protocol_audit_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid REFERENCES protocol_audit_log(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  viewed_at timestamptz DEFAULT now(),
  user_type text CHECK (user_type IN ('internal', 'external'))
);

-- Enable RLS
ALTER TABLE protocol_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_audit_views ENABLE ROW LEVEL SECURITY;

-- Create policies for protocol_audit_log
CREATE POLICY "Users can insert audit logs"
  ON protocol_audit_log
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read audit logs"
  ON protocol_audit_log
  FOR SELECT
  TO public
  USING (true);

-- Create policies for protocol_audit_views
CREATE POLICY "Users can insert audit views"
  ON protocol_audit_views
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read audit views"
  ON protocol_audit_views
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_protocol_id ON protocol_audit_log(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_created_at ON protocol_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_views_audit_log_id ON protocol_audit_views(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_views_user_id ON protocol_audit_views(user_id);

-- Create helper function to log protocol actions
CREATE OR REPLACE FUNCTION log_protocol_action(
  p_protocol_id uuid,
  p_user_id uuid,
  p_action_type text,
  p_action_description text,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_comment text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
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
    comment,
    user_agent
  ) VALUES (
    p_protocol_id,
    p_user_id,
    p_action_type,
    p_action_description,
    p_old_value,
    p_new_value,
    p_comment,
    p_user_agent
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to log audit views
CREATE OR REPLACE FUNCTION log_audit_view(
  p_audit_log_id uuid,
  p_user_id uuid,
  p_user_type text DEFAULT 'internal'
) RETURNS uuid AS $$
DECLARE
  view_id uuid;
BEGIN
  -- Check if this user already viewed this audit entry
  SELECT id INTO view_id
  FROM protocol_audit_views
  WHERE audit_log_id = p_audit_log_id AND user_id = p_user_id;
  
  -- If not viewed before, create new view record
  IF view_id IS NULL THEN
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
