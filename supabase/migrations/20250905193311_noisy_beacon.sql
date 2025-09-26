/*
  # Create default permissions for the system

  1. New Data
    - Default permissions for protocols, users, settings, reports, and notifications
    - Organized by categories for better management
    - Covers all major system operations

  2. Security
    - All authenticated users can read permissions (needed for role management)
*/

-- Insert default permissions
INSERT INTO permissions (codigo, nome, descricao, categoria) VALUES
-- Protocol permissions
('protocols.read', 'Visualizar Protocolos', 'Pode visualizar protocolos do sistema', 'protocols'),
('protocols.create', 'Criar Protocolos', 'Pode criar novos protocolos', 'protocols'),
('protocols.update', 'Editar Protocolos', 'Pode editar protocolos existentes', 'protocols'),
('protocols.delete', 'Excluir Protocolos', 'Pode excluir protocolos', 'protocols'),
('protocols.assign', 'Atribuir Protocolos', 'Pode atribuir protocolos para usuários', 'protocols'),
('protocols.forward', 'Encaminhar Protocolos', 'Pode encaminhar protocolos entre setores', 'protocols'),
('protocols.respond', 'Responder Protocolos', 'Pode responder mensagens em protocolos', 'protocols'),
('protocols.close', 'Finalizar Protocolos', 'Pode finalizar protocolos', 'protocols'),

-- User management permissions
('users.read', 'Visualizar Usuários', 'Pode visualizar lista de usuários', 'users'),
('users.create', 'Criar Usuários', 'Pode criar novos usuários', 'users'),
('users.edit', 'Editar Usuários', 'Pode editar dados de usuários', 'users'),
('users.delete', 'Excluir Usuários', 'Pode excluir usuários do sistema', 'users'),
('users.deactivate', 'Ativar/Desativar Usuários', 'Pode ativar ou desativar usuários', 'users'),

-- Settings permissions
('settings.departments', 'Gerenciar Setores', 'Pode criar e editar setores', 'settings'),
('settings.roles', 'Gerenciar Papéis', 'Pode criar e editar papéis e permissões', 'settings'),
('settings.system', 'Configurações do Sistema', 'Pode alterar configurações gerais', 'settings'),
('settings.integrations', 'Gerenciar Integrações', 'Pode configurar integrações externas', 'settings'),

-- Reports permissions
('reports.view', 'Visualizar Relatórios', 'Pode visualizar relatórios do sistema', 'reports'),
('reports.export', 'Exportar Relatórios', 'Pode exportar relatórios em PDF/Excel', 'reports'),
('reports.advanced', 'Relatórios Avançados', 'Pode acessar relatórios avançados e analytics', 'reports'),

-- Notifications permissions
('notifications.read', 'Visualizar Notificações', 'Pode visualizar notificações', 'notifications'),
('notifications.send', 'Enviar Notificações', 'Pode enviar notificações manuais', 'notifications'),
('notifications.config', 'Configurar Notificações', 'Pode configurar regras de notificação', 'notifications')

ON CONFLICT (codigo) DO NOTHING;
