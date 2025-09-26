/*
  # Fix Phone System Tables Creation Order
  
  1. Create tables in correct order to avoid foreign key issues
  2. First create call_recordings without dependencies
  3. Then create call_history with reference to call_recordings
  4. Add circular reference after both tables exist
*/

-- Create Call Recordings table FIRST (no dependencies)
CREATE TABLE IF NOT EXISTS call_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_url text,
  file_size bigint DEFAULT 0,
  duration integer DEFAULT 0, -- in seconds
  format text DEFAULT 'wav',
  quality text DEFAULT 'standard',
  encryption_key text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create SIP Settings table (no circular dependencies)
CREATE TABLE IF NOT EXISTS sip_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  server text NOT NULL DEFAULT '',
  port integer NOT NULL DEFAULT 8089,
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  display_name text DEFAULT '',
  transport text NOT NULL DEFAULT 'wss',
  stun_servers jsonb DEFAULT '["stun:stun.l.google.com:19302"]',
  turn_servers jsonb DEFAULT '[]',
  auto_register boolean DEFAULT true,
  register_expires integer DEFAULT 300,
  session_timers boolean DEFAULT true,
  dtmf_type text DEFAULT 'rfc2833',
  codec_preferences jsonb DEFAULT '["PCMU", "PCMA", "G722", "opus"]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Create Call History table (can now reference call_recordings)
CREATE TABLE IF NOT EXISTS call_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  protocol_id uuid REFERENCES protocols(id) ON DELETE SET NULL,
  call_id text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  caller_number text NOT NULL,
  callee_number text NOT NULL,
  caller_name text DEFAULT '',
  callee_name text DEFAULT '',
  status text NOT NULL CHECK (status IN ('answered', 'missed', 'rejected', 'failed', 'busy', 'no_answer')),
  start_time timestamptz NOT NULL,
  answer_time timestamptz,
  end_time timestamptz,
  duration integer DEFAULT 0, -- in seconds
  hangup_cause text DEFAULT '',
  ended_by text CHECK (ended_by IN ('caller', 'callee', 'system', 'timeout')),
  recording_id uuid REFERENCES call_recordings(id) ON DELETE SET NULL,
  user_agent text DEFAULT '',
  remote_sdp text DEFAULT '',
  local_sdp text DEFAULT '',
  ice_connection_state text DEFAULT '',
  dtmf_digits text DEFAULT '',
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Now add the circular reference from call_recordings to call_history
ALTER TABLE call_recordings 
  ADD COLUMN call_history_id uuid REFERENCES call_history(id) ON DELETE CASCADE;

-- Create User Permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted boolean DEFAULT false,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tenant_id, permission)
);

-- Enable RLS
ALTER TABLE sip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sip_settings
CREATE POLICY "Users can view own SIP settings" ON sip_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own SIP settings" ON sip_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own SIP settings" ON sip_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own SIP settings" ON sip_settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for call_history
CREATE POLICY "Users can view own call history" ON call_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own call history" ON call_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own call history" ON call_history
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for call_recordings
CREATE POLICY "Users can view own call recordings" ON call_recordings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM call_history 
    WHERE call_history.id = call_recordings.call_history_id 
    AND call_history.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert call recordings" ON call_recordings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM call_history 
    WHERE call_history.id = call_recordings.call_history_id 
    AND call_history.user_id = auth.uid()
  ));

-- RLS Policies for user_permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sip_settings_user_id ON sip_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_call_history_user_id ON call_history(user_id);
CREATE INDEX IF NOT EXISTS idx_call_history_protocol_id ON call_history(protocol_id);
CREATE INDEX IF NOT EXISTS idx_call_history_start_time ON call_history(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_call_recordings_call_history_id ON call_recordings(call_history_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for sip_settings
CREATE TRIGGER update_sip_settings_updated_at
  BEFORE UPDATE ON sip_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default phone permission for all existing users
INSERT INTO user_permissions (user_id, tenant_id, permission, granted)
SELECT id, tenant_id, 'phone.use', true
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_permissions 
  WHERE user_permissions.user_id = users.id 
  AND user_permissions.permission = 'phone.use'
);
