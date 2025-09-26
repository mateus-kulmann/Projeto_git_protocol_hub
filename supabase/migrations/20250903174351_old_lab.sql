/*
  # Enhance notifications log table

  1. Changes
    - Add missing columns to notifications_log table
    - Add indexes for better performance
    - Add sample data structure for delivery tracking

  2. New Fields
    - Add delivery_attempts column
    - Add metadata column for additional tracking info
    - Ensure all status tracking fields exist
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add delivery_attempts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications_log' AND column_name = 'delivery_attempts'
  ) THEN
    ALTER TABLE notifications_log ADD COLUMN delivery_attempts integer DEFAULT 0;
  END IF;

  -- Add metadata column for additional tracking info
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications_log' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications_log ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;

  -- Add channel column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications_log' AND column_name = 'channel'
  ) THEN
    ALTER TABLE notifications_log ADD COLUMN channel text DEFAULT 'email';
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_log_protocol_id ON notifications_log(protocol_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_status ON notifications_log(status);
CREATE INDEX IF NOT EXISTS idx_notifications_log_channel ON notifications_log(channel);

-- Add check constraint for valid statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'notifications_log_status_check'
  ) THEN
    ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_status_check 
    CHECK (status IN ('sent', 'delivered', 'failed', 'received', 'read'));
  END IF;
END $$;

-- Add check constraint for valid channels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'notifications_log_channel_check'
  ) THEN
    ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_channel_check 
    CHECK (channel IN ('email', 'whatsapp', 'sms', 'push'));
  END IF;
END $$;
