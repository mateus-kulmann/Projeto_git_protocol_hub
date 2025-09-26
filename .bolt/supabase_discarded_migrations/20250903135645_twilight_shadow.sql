/*
  # Create Audit Tables Step by Step
  
  1. Create Tables
    - protocol_audit_log: Main audit log table
    - protocol_audit_views: Track who viewed each audit entry
  
  2. Security
    - Enable RLS on both tables
    - Add policies for proper access control
  
  3. Helper Functions
    - Functions to easily log actions and views
*/

-- Step 1: Create protocol_audit_log table
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

-- Step 2: Create protocol_audit_views table
CREATE TABLE IF NOT EXISTS protocol_audit_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL REFERENCES protocol_audit_log(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  viewed_at timestamptz DEFAULT now(),
  user_type text NOT NULL CHECK (user_type IN ('internal', 'external')),
  UNIQUE(audit_log_id, user_id)
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_protocol_id ON protocol_audit_log(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_created_at ON protocol_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_views_audit_log_id ON protocol_audit_views(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_views_user_id ON protocol_audit_views(user_id);

-- Step 4: Enable RLS
ALTER TABLE protocol_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_audit_views ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies for protocol_audit_log
CREATE POLICY "Users can insert audit logs"
  ON protocol_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read audit logs"
  ON protocol_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 6: Create policies for protocol_audit_views
CREATE POLICY "Users can insert audit views"
  ON protocol_audit_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read audit views"
  ON protocol_audit_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 7: Create helper function to log protocol actions
CREATE OR REPLACE FUNCTION log_protocol_action(
  p_protocol_id uuid,
  p_user_id uuid,
  p_action_type text,
  p_action_description text,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_comment text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
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
    p_user_agent,
    p_ip_address
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create helper function to log audit views
CREATE OR REPLACE FUNCTION log_audit_view(
  p_audit_log_id uuid,
  p_user_id uuid,
  p_user_type text
) RETURNS void AS $$
BEGIN
  INSERT INTO protocol_audit_views (
    audit_log_id,
    user_id,
    user_type
  ) VALUES (
    p_audit_log_id,
    p_user_id,
    p_user_type
  ) ON CONFLICT (audit_log_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
