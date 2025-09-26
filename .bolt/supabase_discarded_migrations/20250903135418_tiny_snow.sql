/*
  # Create audit tables for protocol tramitação system

  1. New Tables
    - `protocol_audit_log`
      - `id` (uuid, primary key)
      - `protocol_id` (uuid, foreign key to protocols)
      - `user_id` (uuid, foreign key to users)
      - `action_type` (text)
      - `action_description` (text)
      - `old_value` (text, nullable)
      - `new_value` (text, nullable)
      - `comment` (text, nullable)
      - `user_agent` (text, nullable)
      - `ip_address` (inet, nullable)
      - `created_at` (timestamptz)

    - `protocol_audit_views`
      - `id` (uuid, primary key)
      - `audit_log_id` (uuid, foreign key to protocol_audit_log)
      - `user_id` (uuid, foreign key to users)
      - `viewed_at` (timestamptz)
      - `user_type` (text)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own tenant data
    - Add policies for inserting audit logs and views
*/

-- Create protocol_audit_log table
CREATE TABLE IF NOT EXISTS protocol_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  action_type text NOT NULL,
  action_description text NOT NULL,
  old_value text,
  new_value text,
  comment text,
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- Create protocol_audit_views table
CREATE TABLE IF NOT EXISTS protocol_audit_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL REFERENCES protocol_audit_log(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  viewed_at timestamptz DEFAULT now(),
  user_type text NOT NULL CHECK (user_type IN ('internal', 'external'))
);

-- Enable RLS
ALTER TABLE protocol_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_audit_views ENABLE ROW LEVEL SECURITY;

-- Create policies for protocol_audit_log
CREATE POLICY "Users can read own tenant audit logs"
  ON protocol_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocols p 
      JOIN users u ON u.tenant_id = p.tenant_id 
      WHERE p.id = protocol_audit_log.protocol_id 
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit logs"
  ON protocol_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM protocols p 
      JOIN users u ON u.tenant_id = p.tenant_id 
      WHERE p.id = protocol_audit_log.protocol_id 
      AND u.id = auth.uid()
    )
  );

-- Create policies for protocol_audit_views
CREATE POLICY "Users can read own tenant audit views"
  ON protocol_audit_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocol_audit_log pal
      JOIN protocols p ON p.id = pal.protocol_id
      JOIN users u ON u.tenant_id = p.tenant_id 
      WHERE pal.id = protocol_audit_views.audit_log_id 
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit views"
  ON protocol_audit_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM protocol_audit_log pal
      JOIN protocols p ON p.id = pal.protocol_id
      JOIN users u ON u.tenant_id = p.tenant_id 
      WHERE pal.id = protocol_audit_views.audit_log_id 
      AND u.id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_protocol_id ON protocol_audit_log(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_user_id ON protocol_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_created_at ON protocol_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_views_audit_log_id ON protocol_audit_views(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_views_user_id ON protocol_audit_views(user_id);

-- Create function to automatically log protocol actions
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
    comment,
    user_agent,
    ip_address
  ) VALUES (
    p_protocol_id,
    p_user_id,
    p_action_type,
    p_action_description,
    p_old_value,
    p_new_value,
    p_comment,
    current_setting('request.headers', true)::json->>'user-agent',
    inet_client_addr()
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log audit views
CREATE OR REPLACE FUNCTION log_audit_view(
  p_audit_log_id uuid,
  p_user_id uuid,
  p_user_type text DEFAULT 'internal'
) RETURNS uuid AS $$
DECLARE
  view_id uuid;
BEGIN
  -- Check if user already viewed this audit entry
  IF NOT EXISTS (
    SELECT 1 FROM protocol_audit_views 
    WHERE audit_log_id = p_audit_log_id 
    AND user_id = p_user_id
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
