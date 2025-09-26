/*
  # Fix sender_type constraint

  1. Check current constraint
  2. Update constraint to allow 'agent' value
  3. Ensure proper sender_type values are used
*/

-- First, let's see what the current constraint allows
-- The constraint should allow: 'user', 'client', 'system', 'agent'

-- Drop the existing constraint if it's too restrictive
ALTER TABLE protocol_messages DROP CONSTRAINT IF EXISTS protocol_messages_sender_type_check;

-- Add the correct constraint that includes 'agent'
ALTER TABLE protocol_messages ADD CONSTRAINT protocol_messages_sender_type_check 
CHECK (sender_type = ANY (ARRAY['user'::text, 'client'::text, 'system'::text, 'agent'::text]));
