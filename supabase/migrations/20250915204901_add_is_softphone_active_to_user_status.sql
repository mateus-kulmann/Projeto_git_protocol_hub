-- Migration: Add is_softphone_active to user_status
-- Created: 2025-09-15 20:49:01
-- Purpose: Ensure `user_status` table has the boolean column `is_softphone_active`.

BEGIN;

-- Add column if it doesn't exist
ALTER TABLE IF EXISTS public.user_status
  ADD COLUMN IF NOT EXISTS is_softphone_active boolean DEFAULT false;

-- Ensure existing rows are not NULL (set to false)
UPDATE public.user_status
SET is_softphone_active = false
WHERE is_softphone_active IS NULL;

-- Optional: add comment for documentation
COMMENT ON COLUMN public.user_status.is_softphone_active IS 'Indica se o softphone do usuário está ativo (true/false)';

COMMIT;
