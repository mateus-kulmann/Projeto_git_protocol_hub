/*
  # Correção Final da Lógica das Políticas RLS para sip_settings
  
  Esta migração corrige um erro fundamental nas políticas RLS anteriores,
  que comparavam o `users.id` (ID da tabela pública) com o `auth.uid()`
  (ID de autenticação). A comparação correta deve ser feita através da coluna `users.auth_user_id`.
  
  1. Remove as políticas RLS antigas e incorretas da tabela `sip_settings`.
  2. Cria novas políticas com a lógica de verificação correta.
  3. A lógica de permissão é:
     - SELECT: Usuários podem ver suas próprias configurações. Admins/Supervisores podem ver todas.
     - INSERT: Apenas Admins/Supervisores podem criar.
     - UPDATE: Apenas Admins/Supervisores podem atualizar.
     - DELETE: Apenas Admins podem deletar.
*/

-- Remover as políticas incorretas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can insert own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can update own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can delete own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_select_own" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_insert_admin_supervisor" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_update_admin_supervisor" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_delete_admin" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_select_policy" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_insert_policy" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_update_policy" ON sip_settings;
DROP POLICY IF EXISTS "sip_settings_delete_policy" ON sip_settings;

-- Função auxiliar para obter o role do usuário atual de forma segura
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.nome INTO user_role
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política 1: SELECT - Usuários podem ver suas próprias configurações, admins/supervisores podem ver todas.
CREATE POLICY "sip_settings_select_policy" ON public.sip_settings
FOR SELECT
TO authenticated
USING (
  -- Admins/Supervisores podem ver tudo
  (get_current_user_role() IN ('admin', 'supervisor'))
  OR
  -- Usuários podem ver suas próprias configurações (a subconsulta agora é correta)
  (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
);

-- Política 2: INSERT - Apenas admins e supervisores podem inserir
CREATE POLICY "sip_settings_insert_policy" ON public.sip_settings
FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('admin', 'supervisor')
);

-- Política 3: UPDATE - Apenas admins e supervisores podem atualizar
CREATE POLICY "sip_settings_update_policy" ON public.sip_settings
FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('admin', 'supervisor')
)
WITH CHECK (
  get_current_user_role() IN ('admin', 'supervisor')
);

-- Política 4: DELETE - Apenas admins podem deletar
CREATE POLICY "sip_settings_delete_policy" ON public.sip_settings
FOR DELETE
TO authenticated
USING (
  get_current_user_role() = 'admin'
);

-- Adicionar comentários para documentação
COMMENT ON POLICY "sip_settings_select_policy" ON public.sip_settings IS 'Usuários podem ver suas próprias configurações SIP; Admins/Supervisores podem ver todas.';
COMMENT ON POLICY "sip_settings_insert_policy" ON public.sip_settings IS 'Apenas admins e supervisores podem criar configurações SIP.';
COMMENT ON POLICY "sip_settings_update_policy" ON public.sip_settings IS 'Apenas admins e supervisores podem atualizar configurações SIP.';
COMMENT ON POLICY "sip_settings_delete_policy" ON public.sip_settings IS 'Apenas admins podem deletar configurações SIP.';
