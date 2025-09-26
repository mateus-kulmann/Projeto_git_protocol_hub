/*
  # Fix duplicate function error

  1. Drop existing function with all possible signatures
  2. Create the correct function with proper signature
  3. Ensure no conflicts
*/

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS log_protocol_action(uuid, uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS log_protocol_action(text, text, text, uuid, text, uuid);
DROP FUNCTION IF EXISTS log_protocol_action(uuid, uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.log_protocol_action CASCADE;

-- Create the function with the correct signature
CREATE OR REPLACE FUNCTION log_protocol_action(
  p_protocol_id uuid,
  p_user_id uuid,
  p_action_type text,
  p_action_description text,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_comment text DEFAULT NULL
) RETURNS void AS $$
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
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
