/*
  # Fix Protocol Number Format

  1. Updates
    - Update the trigger function to generate protocol numbers in format YYYYMMDD.12345678
    - 8 random digits instead of sequential numbering
    - Ensures uniqueness while maintaining the requested format

  2. Changes
    - Modify set_protocol_number() function to use YYYYMMDD.12345678 format
    - Use random 8-digit number instead of sequence
    - Add retry logic in case of collision (very unlikely)
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_set_protocol_number ON protocols;

-- Update the function to generate YYYYMMDD.12345678 format
CREATE OR REPLACE FUNCTION set_protocol_number()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    random_part TEXT;
    new_number TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    -- Only set number if it's not already provided
    IF NEW.numero IS NULL THEN
        -- Get current date in YYYYMMDD format
        date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
        
        -- Generate protocol number with retry logic for uniqueness
        LOOP
            -- Generate 8 random digits
            random_part := LPAD(floor(random() * 100000000)::text, 8, '0');
            
            -- Combine date and random parts
            new_number := date_part || '.' || random_part;
            
            -- Check if this number already exists
            IF NOT EXISTS (SELECT 1 FROM protocols WHERE numero = new_number) THEN
                NEW.numero := new_number;
                EXIT;
            END IF;
            
            -- Increment attempt counter
            attempt := attempt + 1;
            
            -- If we've tried too many times, raise an error
            IF attempt >= max_attempts THEN
                RAISE EXCEPTION 'Could not generate unique protocol number after % attempts', max_attempts;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_set_protocol_number
    BEFORE INSERT ON protocols
    FOR EACH ROW
    EXECUTE FUNCTION set_protocol_number();
