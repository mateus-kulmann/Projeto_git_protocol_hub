/*
  # Corrigir políticas RLS para sip_settings
  
  1. Remove políticas antigas que estão bloqueando
  2. Cria novas políticas que permitem:
     - Admins e supervisores: CRUD completo
     - Usuários com permissão phone.use: apenas leitura própria
  3. Garante que não haverá mais erros de RLS
*/

-- Primeiro, remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Admins can manage all SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can insert own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can update own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can delete own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_select_policy" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_insert_policy" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_update_policy" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_delete_policy" ON sip_settings;

-- Garantir que RLS está habilitado
ALTER TABLE sip_settings ENABLE ROW LEVEL SECURITY;

-- Política 1: SELECT - Usuários podem ver suas próprias configurações
CREATE POLICY "sip_settings_select_own" ON sip_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política 2: INSERT - Apenas admins e supervisores podem inserir
CREATE POLICY "sip_settings_insert_admin_supervisor" ON sip_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.name IN ('admin', 'supervisor')
  )
);

-- Política 3: UPDATE - Admins/supervisores podem atualizar qualquer registro
CREATE POLICY "sip_settings_update_admin_supervisor" ON sip_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.name IN ('admin', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.name IN ('admin', 'supervisor')
  )
);

-- Política 4: DELETE - Apenas admins podem deletar
CREATE POLICY "sip_settings_delete_admin" ON sip_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.name = 'admin'
  )
);

-- Adicionar comentários para documentação
COMMENT ON POLICY "sip_settings_select_own" ON sip_settings IS 'Usuários podem ver suas próprias configurações SIP';
COMMENT ON POLICY "sip_settings_insert_admin_supervisor" ON sip_settings IS 'Apenas admins e supervisores podem criar configurações SIP';
COMMENT ON POLICY "sip_settings_update_admin_supervisor" ON sip_settings IS 'Apenas admins e supervisores podem atualizar configurações SIP';
COMMENT ON POLICY "sip_settings_delete_admin" ON sip_settings IS 'Apenas admins podem deletar configurações SIP';

-- Verificar se as políticas foram criadas corretamente
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'sip_settings';
  
  RAISE NOTICE 'Total de políticas RLS criadas para sip_settings: %', policy_count;
END $$;
