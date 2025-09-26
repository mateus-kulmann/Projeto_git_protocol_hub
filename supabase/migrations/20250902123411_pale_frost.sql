/*
  # Fix tenant UUIDs and data consistency

  1. Updates
    - Update users table to use proper UUID for tenant_id
    - Update all related tables to use correct tenant UUID
    - Ensure data consistency across all tables

  2. Data fixes
    - Fix tenant_id references in users, departments, categories, protocols
    - Ensure all foreign key relationships are valid
*/

-- First, get the actual tenant UUID
DO $$
DECLARE
    tenant_uuid uuid;
BEGIN
    -- Get the tenant UUID
    SELECT id INTO tenant_uuid FROM tenants WHERE dominio = 'demo.local' LIMIT 1;
    
    -- If no tenant exists, create one
    IF tenant_uuid IS NULL THEN
        INSERT INTO tenants (nome, dominio, ativo) 
        VALUES ('Demo Company', 'demo.local', true)
        RETURNING id INTO tenant_uuid;
    END IF;
    
    -- Update users table to use proper UUID
    UPDATE users SET tenant_id = tenant_uuid WHERE tenant_id::text = '1' OR tenant_id IS NULL;
    
    -- Update departments table
    UPDATE departments SET tenant_id = tenant_uuid WHERE tenant_id::text = '1' OR tenant_id IS NULL;
    
    -- Update categories table
    UPDATE categories SET tenant_id = tenant_uuid WHERE tenant_id::text = '1' OR tenant_id IS NULL;
    
    -- Update protocols table
    UPDATE protocols SET tenant_id = tenant_uuid WHERE tenant_id::text = '1' OR tenant_id IS NULL;
END $$;
