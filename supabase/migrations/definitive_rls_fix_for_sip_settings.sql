/*
  # Correção Definitiva das Políticas RLS para sip_settings (Abordagem Simplificada)

  Esta migração substitui a abordagem anterior que usava uma função auxiliar (get_current_user_role)
  por uma lógica de subconsulta direta dentro das políticas. Isso remove um ponto de falha
  potencial e torna as permissões mais explícitas e fáceis de depurar.

  1. Remove a função auxiliar `get_current_user_role()`.
  2. Remove todas as políticas RLS anteriores da tabela `sip_settings` para garantir um estado limpo.
  3. Cria novas políticas com a lógica de verificação de papéis embutida:
     - SELECT: Usuários podem ver suas próprias configurações. Admins/Supervisores podem ver todas.
     - INSERT: Apenas Admins/Supervisores podem criar.
     - UPDATE: Apenas Admins/Supervisores podem atualizar.
     - DELETE: Apenas Admins podem deletar.
*/

-- 1. Remover a função auxiliar que pode estar causando o problema de contexto
DROP FUNCTION IF EXISTS get_current_user_role();

-- 2. Remover as políticas existentes para evitar conflitos e garantir um estado limpo
DROP POLICY IF EXISTS "sip_settings_select_policy" ON public.sip_settings;
DROP POLICY IF EXISTS "sip_settings_insert_policy" ON public.sip_settings;
DROP POLICY IF EXISTS "sip_settings_update_policy" ON public.sip_settings;
DROP POLICY IF EXISTS "sip_settings_delete_policy" ON public.sip_settings;
DROP POLICY IF EXISTS "Users can view own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can insert own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can update own SIP settings" ON sip_settings;
DROP POLICY IF EXISTS "Users can delete own SIP settings" ON sip_settings;

-- 3. Criar as novas políticas com lógica de verificação de papel embutida

-- Política 1: SELECT
CREATE POLICY "sip_settings_select_policy" ON public.sip_settings
FOR SELECT
TO authenticated
USING (
  -- Condição 1: O usuário logado é admin ou supervisor (pode ver tudo)
  (
    (SELECT r.nome FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.auth_user_id = auth.uid()) IN ('admin', 'supervisor')
  )
  OR
  -- Condição 2: O usuário logado está tentando acessar suas próprias configurações
  (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

-- Política 2: INSERT
CREATE POLICY "sip_settings_insert_policy" ON public.sip_settings
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT r.nome FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.auth_user_id = auth.uid()) IN ('admin', 'supervisor')
);

-- Política 3: UPDATE
CREATE POLICY "sip_settings_update_policy" ON public.sip_settings
FOR UPDATE
TO authenticated
USING (
  (SELECT r.nome FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.auth_user_id = auth.uid()) IN ('admin', 'supervisor')
)
WITH CHECK (
  (SELECT r.nome FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.auth_user_id = auth.uid()) IN ('admin', 'supervisor')
);

-- Política 4: DELETE
CREATE POLICY "sip_settings_delete_policy" ON public.sip_settings
FOR DELETE
TO authenticated
USING (
  (SELECT r.nome FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.auth_user_id = auth.uid()) = 'admin'
);

-- Adicionar comentários para documentação
COMMENT ON POLICY "sip_settings_select_policy" ON public.sip_settings IS 'Usuários podem ver suas próprias configurações SIP; Admins/Supervisores podem ver todas.';
COMMENT ON POLICY "sip_settings_insert_policy" ON public.sip_settings IS 'Apenas admins e supervisores podem criar configurações SIP.';
COMMENT ON POLICY "sip_settings_update_policy" ON public.sip_settings IS 'Apenas admins e supervisores podem atualizar configurações SIP.';
COMMENT ON POLICY "sip_settings_delete_policy" ON public.sip_settings IS 'Apenas admins podem deletar configurações SIP.';
