/*
  # Adicionar constraint única na tabela sip_settings
  
  1. Adicionar constraint única na coluna user_id
  2. Isso permite usar ON CONFLICT (user_id) para upsert
  3. Garante que cada usuário tenha apenas uma configuração SIP
*/

-- Primeiro, remover duplicatas se existirem (mantém o registro mais recente)
DELETE FROM sip_settings a
USING sip_settings b
WHERE a.id < b.id 
  AND a.user_id = b.user_id;

-- Adicionar constraint única na coluna user_id
ALTER TABLE sip_settings 
ADD CONSTRAINT sip_settings_user_id_unique UNIQUE (user_id);

-- Comentário para documentar a constraint
COMMENT ON CONSTRAINT sip_settings_user_id_unique ON sip_settings 
IS 'Garante que cada usuário tenha apenas uma configuração SIP';
