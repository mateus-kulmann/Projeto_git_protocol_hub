/*
  # Sistema Avançado de Permissões

  1. New Tables
    - `roles` - Papéis customizáveis por tenant
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `nome` (text, nome do papel)
      - `descricao` (text, descrição do papel)
      - `is_system` (boolean, se é papel do sistema)
      - `ativo` (boolean, se está ativo)
      - `created_at` (timestamp)
    
    - `permissions` - Permissões disponíveis no sistema
      - `id` (uuid, primary key)
      - `codigo` (text, código único da permissão)
      - `nome` (text, nome da permissão)
      - `descricao` (text, descrição da permissão)
      - `categoria` (text, categoria da permissão)
      - `created_at` (timestamp)
    
    - `role_permissions` - Relacionamento entre papéis e permissões
      - `id` (uuid, primary key)
      - `role_id` (uuid, foreign key)
      - `permission_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Changes
    - Adicionar `role_id` na tabela `users`
    - Manter `funcao` para compatibilidade

  3. Security
    - Enable RLS em todas as novas tabelas
    - Políticas para admins gerenciarem papéis
    - Políticas para usuários verem próprias permissões

  4. Data
    - Inserir permissões padrão do sistema
    - Criar papéis padrão (admin, agent, etc.)
    - Migrar usuários existentes
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  is_system boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao text,
  categoria text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Add telefone column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telefone'
  ) THEN
    ALTER TABLE users ADD COLUMN telefone text;
  END IF;
END $$;

-- Add role_id column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE users ADD COLUMN role_id uuid REFERENCES roles(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Admins can manage roles in their tenant"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.funcao = 'admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.funcao = 'admin'
    )
  );

CREATE POLICY "Users can read roles from their tenant"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u 
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for permissions
CREATE POLICY "All authenticated users can read permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for role_permissions
CREATE POLICY "Users can read role permissions for their tenant roles"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    role_id IN (
      SELECT r.id 
      FROM roles r 
      JOIN users u ON u.tenant_id = r.tenant_id 
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage role permissions for their tenant"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    role_id IN (
      SELECT r.id 
      FROM roles r 
      JOIN users u ON u.tenant_id = r.tenant_id 
      WHERE u.auth_user_id = auth.uid() 
      AND u.funcao = 'admin'
    )
  )
  WITH CHECK (
    role_id IN (
      SELECT r.id 
      FROM roles r 
      JOIN users u ON u.tenant_id = r.tenant_id 
      WHERE u.auth_user_id = auth.uid() 
      AND u.funcao = 'admin'
    )
  );

-- Insert system permissions
INSERT INTO permissions (codigo, nome, descricao, categoria) VALUES
-- Protocols permissions
('protocols.view', 'Ver Protocolos', 'Visualizar lista de protocolos', 'protocols'),
('protocols.view_all', 'Ver Todos os Protocolos', 'Ver protocolos de todos os setores', 'protocols'),
('protocols.create', 'Criar Protocolos', 'Criar novos protocolos', 'protocols'),
('protocols.edit', 'Editar Protocolos', 'Editar dados dos protocolos', 'protocols'),
('protocols.assign', 'Atribuir Protocolos', 'Atribuir protocolos para usuários', 'protocols'),
('protocols.forward', 'Encaminhar Protocolos', 'Encaminhar protocolos entre setores', 'protocols'),
('protocols.close', 'Finalizar Protocolos', 'Marcar protocolos como finalizados', 'protocols'),
('protocols.delete', 'Excluir Protocolos', 'Excluir protocolos do sistema', 'protocols'),

-- Messages permissions
('messages.send', 'Enviar Mensagens', 'Enviar mensagens nos protocolos', 'messages'),
('messages.send_internal', 'Mensagens Internas', 'Enviar mensagens internas', 'messages'),
('messages.view_internal', 'Ver Mensagens Internas', 'Visualizar mensagens internas', 'messages'),

-- Users permissions
('users.view', 'Ver Usuários', 'Visualizar lista de usuários', 'users'),
('users.create', 'Criar Usuários', 'Criar novos usuários', 'users'),
('users.edit', 'Editar Usuários', 'Editar dados dos usuários', 'users'),
('users.deactivate', 'Desativar Usuários', 'Ativar/desativar usuários', 'users'),
('users.delete', 'Excluir Usuários', 'Excluir usuários do sistema', 'users'),

-- Departments permissions
('departments.view', 'Ver Setores', 'Visualizar lista de setores', 'departments'),
('departments.create', 'Criar Setores', 'Criar novos setores', 'departments'),
('departments.edit', 'Editar Setores', 'Editar dados dos setores', 'departments'),
('departments.delete', 'Excluir Setores', 'Excluir setores', 'departments'),

-- Categories permissions
('categories.view', 'Ver Categorias', 'Visualizar categorias', 'categories'),
('categories.create', 'Criar Categorias', 'Criar novas categorias', 'categories'),
('categories.edit', 'Editar Categorias', 'Editar categorias', 'categories'),

-- Reports permissions
('reports.view', 'Ver Relatórios', 'Visualizar relatórios básicos', 'reports'),
('reports.advanced', 'Relatórios Avançados', 'Acessar relatórios avançados', 'reports'),
('reports.export', 'Exportar Relatórios', 'Exportar dados dos relatórios', 'reports'),

-- Settings permissions
('settings.view', 'Ver Configurações', 'Acessar configurações', 'settings'),
('settings.edit', 'Editar Configurações', 'Modificar configurações do sistema', 'settings'),
('settings.roles', 'Gerenciar Papéis', 'Criar e editar papéis customizados', 'settings'),

-- Chat permissions
('chat.access', 'Acessar Chat', 'Usar funcionalidade de chat', 'chat'),
('chat.view_all', 'Ver Todos os Chats', 'Ver chats de todos os protocolos', 'chat')

ON CONFLICT (codigo) DO NOTHING;

-- Insert default roles for existing tenants
DO $$
DECLARE
  tenant_record RECORD;
  admin_role_id uuid;
  agent_role_id uuid;
  supervisor_role_id uuid;
  client_role_id uuid;
  viewer_role_id uuid;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants LOOP
    -- Create admin role
    INSERT INTO roles (tenant_id, nome, descricao, is_system, ativo)
    VALUES (tenant_record.id, 'Administrador', 'Acesso total ao sistema', true, true)
    RETURNING id INTO admin_role_id;
    
    -- Create agent role
    INSERT INTO roles (tenant_id, nome, descricao, is_system, ativo)
    VALUES (tenant_record.id, 'Atendente', 'Atendimento de protocolos do setor', true, true)
    RETURNING id INTO agent_role_id;
    
    -- Create supervisor role
    INSERT INTO roles (tenant_id, nome, descricao, is_system, ativo)
    VALUES (tenant_record.id, 'Supervisor', 'Supervisão de setor e relatórios', true, true)
    RETURNING id INTO supervisor_role_id;
    
    -- Create client role
    INSERT INTO roles (tenant_id, nome, descricao, is_system, ativo)
    VALUES (tenant_record.id, 'Cliente', 'Acesso aos próprios protocolos', true, true)
    RETURNING id INTO client_role_id;
    
    -- Create viewer role
    INSERT INTO roles (tenant_id, nome, descricao, is_system, ativo)
    VALUES (tenant_record.id, 'Visualizador', 'Visualização apenas', true, true)
    RETURNING id INTO viewer_role_id;
    
    -- Assign all permissions to admin role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions;
    
    -- Assign basic permissions to agent role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT agent_role_id, id FROM permissions 
    WHERE codigo IN (
      'protocols.view', 'protocols.create', 'protocols.edit', 'protocols.assign', 
      'protocols.forward', 'protocols.close', 'messages.send', 'messages.send_internal',
      'messages.view_internal', 'chat.access', 'categories.view', 'departments.view'
    );
    
    -- Assign permissions to supervisor role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT supervisor_role_id, id FROM permissions 
    WHERE codigo IN (
      'protocols.view', 'protocols.view_all', 'protocols.create', 'protocols.edit', 
      'protocols.assign', 'protocols.forward', 'protocols.close', 'messages.send', 
      'messages.send_internal', 'messages.view_internal', 'users.view', 'users.edit',
      'departments.view', 'categories.view', 'reports.view', 'reports.advanced',
      'chat.access', 'chat.view_all'
    );
    
    -- Assign basic permissions to client role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT client_role_id, id FROM permissions 
    WHERE codigo IN ('protocols.view', 'messages.send', 'chat.access');
    
    -- Assign view permissions to viewer role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT viewer_role_id, id FROM permissions 
    WHERE codigo IN ('protocols.view', 'departments.view', 'categories.view', 'reports.view');
    
    -- Update existing users to use roles
    UPDATE users SET role_id = admin_role_id WHERE tenant_id = tenant_record.id AND funcao = 'admin';
    UPDATE users SET role_id = agent_role_id WHERE tenant_id = tenant_record.id AND funcao = 'agent';
    UPDATE users SET role_id = supervisor_role_id WHERE tenant_id = tenant_record.id AND funcao = 'supervisor';
    UPDATE users SET role_id = client_role_id WHERE tenant_id = tenant_record.id AND funcao = 'client';
    UPDATE users SET role_id = viewer_role_id WHERE tenant_id = tenant_record.id AND funcao = 'viewer';
  END LOOP;
END $$;

-- Update users table RLS policies to use role-based permissions
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- New RLS policy for users - admins can see all users in their tenant
CREATE POLICY "Users can read based on permissions"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- User can see own data
    auth_user_id = auth.uid()
    OR
    -- Or user has users.view permission
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.auth_user_id = auth.uid()
      AND p.codigo = 'users.view'
      AND u.tenant_id = users.tenant_id
    )
  );

CREATE POLICY "Users can update based on permissions"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update own data
    auth_user_id = auth.uid()
    OR
    -- Or user has users.edit permission
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.auth_user_id = auth.uid()
      AND p.codigo = 'users.edit'
      AND u.tenant_id = users.tenant_id
    )
  );

CREATE POLICY "Users can insert based on permissions"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.auth_user_id = auth.uid()
      AND p.codigo = 'users.create'
      AND u.tenant_id = users.tenant_id
    )
  );

-- Create helper function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(permission_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.auth_user_id = auth.uid()
    AND p.codigo = permission_code
    AND u.ativo = true
    AND r.ativo = true
  );
END;
$$;
