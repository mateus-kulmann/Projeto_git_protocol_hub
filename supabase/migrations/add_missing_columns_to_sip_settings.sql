/*
  # Adicionar colunas faltantes na tabela sip_settings
  
  1. Adicionar coluna 'enabled' (boolean)
  2. Verificar e adicionar outras colunas que podem estar faltando
  3. Atualizar índices se necessário
*/

-- Adicionar coluna 'enabled' se não existir
ALTER TABLE sip_settings 
ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

-- Verificar e adicionar outras colunas que podem estar faltando
ALTER TABLE sip_settings 
ADD COLUMN IF NOT EXISTS sip_server text NOT NULL DEFAULT '';

ALTER TABLE sip_settings 
ADD COLUMN IF NOT EXISTS sip_port integer NOT NULL DEFAULT 5060;

ALTER TABLE sip_settings 
ADD COLUMN IF NOT EXISTS sip_username text NOT NULL DEFAULT '';

ALTER TABLE sip_settings 
ADD COLUMN IF NOT EXISTS sip_password text NOT NULL DEFAULT '';

ALTER TABLE sip_settings 
ADD COLUMN IF NOT EXISTS sip_domain text;

ALTER TABLE sip_settings 
ADD COLUMN IF NOT EXISTS transport text NOT NULL DEFAULT 'WSS';

-- Atualizar registros existentes para ter enabled = true por padrão
UPDATE sip_settings 
SET enabled = true 
WHERE enabled IS NULL;

-- Adicionar constraint para transport se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sip_settings_transport_check' 
        AND table_name = 'sip_settings'
    ) THEN
        ALTER TABLE sip_settings 
        ADD CONSTRAINT sip_settings_transport_check 
        CHECK (transport IN ('UDP', 'TCP', 'TLS', 'WS', 'WSS'));
    END IF;
END $$;

-- Comentário para documentar a correção
COMMENT ON COLUMN sip_settings.enabled IS 'Indica se o softphone está habilitado para o usuário';
