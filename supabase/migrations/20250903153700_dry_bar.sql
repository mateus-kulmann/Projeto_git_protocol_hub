/*
  # Improve audit views system

  1. Enhanced Views Tracking
    - Add department tracking for internal users
    - Add access channel tracking
    - Add IP address and user agent for better audit trail
    - Ensure unique views per user per audit entry

  2. Security
    - Maintain existing RLS policies
    - Add indexes for better performance
*/

-- Drop existing table to recreate with better structure
DROP TABLE IF EXISTS protocol_audit_views CASCADE;

-- Create improved protocol_audit_views table
CREATE TABLE protocol_audit_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL REFERENCES protocol_audit_log(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  user_type text NOT NULL DEFAULT 'internal' CHECK (user_type IN ('internal', 'external')),
  department_name text,
  access_channel text DEFAULT 'web' CHECK (access_channel IN ('web', 'email', 'whatsapp', 'mobile', 'api')),
  user_ip inet,
  user_agent text,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one view per user per audit entry
  UNIQUE(audit_log_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_protocol_audit_views_audit_log_id ON protocol_audit_views(audit_log_id);
CREATE INDEX idx_protocol_audit_views_user_id ON protocol_audit_views(user_id);
CREATE INDEX idx_protocol_audit_views_viewed_at ON protocol_audit_views(viewed_at);

-- Enable RLS
ALTER TABLE protocol_audit_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own audit views"
  ON protocol_audit_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can read audit views for their tenant protocols"
  ON protocol_audit_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocol_audit_log pal
      JOIN protocols p ON p.id = pal.protocol_id
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE pal.id = audit_log_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own audit views"
  ON protocol_audit_views
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
