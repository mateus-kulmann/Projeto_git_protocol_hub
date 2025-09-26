/*
  # Improve Protocol Audit Trail System

  1. New Tables
    - `protocol_audit_log` - Detailed audit log for all protocol actions
    - `message_views` - Track when messages are viewed by users
    
  2. Enhanced Tables
    - Add more audit fields to existing tables
    - Better tracking of user actions
    
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
    
  4. Functions
    - Auto-populate audit fields
    - Track user actions automatically
*/

-- Create protocol audit log table
CREATE TABLE IF NOT EXISTS protocol_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action_type text NOT NULL, -- 'status_change', 'assignment', 'forward', 'message', 'view', etc.
  action_description text NOT NULL,
  old_value text,
  new_value text,
  user_ip inet,
  user_agent text,
  additional_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create message views tracking table
CREATE TABLE IF NOT EXISTS message_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES protocol_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  user_type text NOT NULL DEFAULT 'internal', -- 'internal', 'external', 'client'
  viewed_at timestamptz DEFAULT now(),
  user_ip inet,
  user_agent text,
  UNIQUE(message_id, user_id)
);

-- Add audit fields to existing tables
DO $$
BEGIN
  -- Add audit fields to protocol_messages if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'protocol_messages' AND column_name = 'created_by_ip'
  ) THEN
    ALTER TABLE protocol_messages 
    ADD COLUMN created_by_ip inet,
    ADD COLUMN created_by_user_agent text,
    ADD COLUMN last_edited_at timestamptz,
    ADD COLUMN last_edited_by uuid REFERENCES users(id);
  END IF;

  -- Add audit fields to protocols if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'protocols' AND column_name = 'last_status_changed_by'
  ) THEN
    ALTER TABLE protocols 
    ADD COLUMN last_status_changed_by uuid REFERENCES users(id),
    ADD COLUMN last_status_changed_at timestamptz,
    ADD COLUMN last_assigned_by uuid REFERENCES users(id),
    ADD COLUMN last_assigned_at timestamptz;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE protocol_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for protocol_audit_log
CREATE POLICY "Users can read audit logs for their tenant protocols"
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
  WITH CHECK (true);

-- RLS Policies for message_views
CREATE POLICY "Users can read message views for their tenant"
  ON message_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocol_messages pm
      JOIN protocols p ON p.id = pm.protocol_id
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE pm.id = message_views.message_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert message views"
  ON message_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own message views"
  ON message_views
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to log protocol actions
CREATE OR REPLACE FUNCTION log_protocol_action(
  p_protocol_id uuid,
  p_user_id uuid,
  p_action_type text,
  p_action_description text,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_additional_data jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO protocol_audit_log (
    protocol_id,
    user_id,
    action_type,
    action_description,
    old_value,
    new_value,
    additional_data
  ) VALUES (
    p_protocol_id,
    p_user_id,
    p_action_type,
    p_action_description,
    p_old_value,
    p_new_value,
    p_additional_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track message views
CREATE OR REPLACE FUNCTION track_message_view(
  p_message_id uuid,
  p_user_id uuid,
  p_user_type text DEFAULT 'internal'
) RETURNS void AS $$
BEGIN
  INSERT INTO message_views (message_id, user_id, user_type, viewed_at)
  VALUES (p_message_id, p_user_id, p_user_type, now())
  ON CONFLICT (message_id, user_id) 
  DO UPDATE SET viewed_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_protocol_id ON protocol_audit_log(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_audit_log_created_at ON protocol_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_message_views_message_id ON message_views(message_id);
CREATE INDEX IF NOT EXISTS idx_message_views_user_id ON message_views(user_id);
