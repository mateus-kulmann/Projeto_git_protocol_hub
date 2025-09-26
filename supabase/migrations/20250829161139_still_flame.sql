-- Sample data for ProtocolHub Supabase tables
-- Execute this script in your Supabase SQL Editor

-- 1. Insert Tenant
INSERT INTO tenants (nome, dominio, configuracao, ativo) VALUES 
('Demo Company', 'demo.local', '{"theme": "default", "features": ["chat", "notifications"]}', true);

-- Get tenant ID for reference (you'll need to replace this UUID with the actual one generated)
-- After running the above, check the tenants table and copy the generated UUID

-- 2. Insert Departments (replace tenant_id with actual UUID from step 1)
INSERT INTO departments (tenant_id, nome, descricao, ativo) VALUES 
((SELECT id FROM tenants WHERE dominio = 'demo.local'), 'TI', 'Tecnologia da Informação', true),
((SELECT id FROM tenants WHERE dominio = 'demo.local'), 'RH', 'Recursos Humanos', true),
((SELECT id FROM tenants WHERE dominio = 'demo.local'), 'Financeiro', 'Departamento Financeiro', true);

-- 3. Insert Users (password is bcrypt hash of 'admin123')
INSERT INTO users (tenant_id, nome, email, senha, funcao, department_id, ativo) VALUES 
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'), 
  'Administrador', 
  'admin@demo.local', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'admin', 
  (SELECT id FROM departments WHERE nome = 'TI' LIMIT 1), 
  true
),
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'), 
  'João Silva', 
  'joao@demo.local', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'agent', 
  (SELECT id FROM departments WHERE nome = 'TI' LIMIT 1), 
  true
),
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'), 
  'Maria Santos', 
  'maria@demo.local', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'agent', 
  (SELECT id FROM departments WHERE nome = 'RH' LIMIT 1), 
  true
);

-- 4. Insert Categories
INSERT INTO categories (tenant_id, nome, department_id, auto_assign, prioridade, sla_hours) VALUES 
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'), 
  'Suporte Técnico', 
  (SELECT id FROM departments WHERE nome = 'TI' LIMIT 1), 
  true, 
  'medium', 
  24
),
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'), 
  'Solicitação de Acesso', 
  (SELECT id FROM departments WHERE nome = 'RH' LIMIT 1), 
  false, 
  'low', 
  48
),
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'), 
  'Questões Financeiras', 
  (SELECT id FROM departments WHERE nome = 'Financeiro' LIMIT 1), 
  false, 
  'high', 
  12
);

-- 5. Insert Sample Protocols
INSERT INTO protocols (
  tenant_id, 
  assunto, 
  status, 
  prioridade, 
  canal, 
  requester_name, 
  requester_email, 
  requester_phone, 
  requester_cpf,
  current_department_id, 
  assigned_user_id, 
  category_id, 
  chat_active
) VALUES 
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'),
  'Problema com impressora HP LaserJet',
  'open',
  'medium',
  'email',
  'Carlos Oliveira',
  'carlos@empresa.com',
  '(11) 99999-1111',
  '123.456.789-00',
  (SELECT id FROM departments WHERE nome = 'TI' LIMIT 1),
  (SELECT id FROM users WHERE email = 'joao@demo.local'),
  (SELECT id FROM categories WHERE nome = 'Suporte Técnico'),
  false
),
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'),
  'Solicitação de novo usuário no sistema',
  'in_progress',
  'low',
  'web',
  'Ana Costa',
  'ana@empresa.com',
  '(11) 88888-2222',
  '987.654.321-00',
  (SELECT id FROM departments WHERE nome = 'RH' LIMIT 1),
  (SELECT id FROM users WHERE email = 'maria@demo.local'),
  (SELECT id FROM categories WHERE nome = 'Solicitação de Acesso'),
  true
),
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'),
  'Dúvida sobre reembolso de despesas',
  'pending',
  'high',
  'whatsapp',
  'Roberto Lima',
  'roberto@empresa.com',
  '(11) 77777-3333',
  '456.789.123-00',
  (SELECT id FROM departments WHERE nome = 'Financeiro' LIMIT 1),
  (SELECT id FROM users WHERE email = 'admin@demo.local'),
  (SELECT id FROM categories WHERE nome = 'Questões Financeiras'),
  false
),
(
  (SELECT id FROM tenants WHERE dominio = 'demo.local'),
  'Chat ativo - Problema urgente com servidor',
  'open',
  'high',
  'chat',
  'Fernanda Silva',
  'fernanda@empresa.com',
  '(11) 66666-4444',
  '789.123.456-00',
  (SELECT id FROM departments WHERE nome = 'TI' LIMIT 1),
  (SELECT id FROM users WHERE email = 'joao@demo.local'),
  (SELECT id FROM categories WHERE nome = 'Suporte Técnico'),
  true
);

-- 6. Insert Protocol Messages
INSERT INTO protocol_messages (protocol_id, user_id, sender_type, conteudo, tipo, is_internal) VALUES 
-- Messages for first protocol
(
  (SELECT id FROM protocols WHERE assunto LIKE '%impressora%' LIMIT 1),
  (SELECT id FROM users WHERE email = 'admin@demo.local'),
  'system',
  'Protocolo criado automaticamente via email',
  'system',
  false
),
(
  (SELECT id FROM protocols WHERE assunto LIKE '%impressora%' LIMIT 1),
  (SELECT id FROM users WHERE email = 'joao@demo.local'),
  'user',
  'Protocolo atribuído ao setor de TI. Iniciando análise do problema.',
  'message',
  true
),

-- Messages for chat protocol
(
  (SELECT id FROM protocols WHERE assunto LIKE '%Chat ativo%' LIMIT 1),
  (SELECT id FROM users WHERE email = 'admin@demo.local'),
  'system',
  'Chat iniciado pelo cliente',
  'system',
  false
),
(
  (SELECT id FROM protocols WHERE assunto LIKE '%Chat ativo%' LIMIT 1),
  NULL,
  'client',
  'Olá, estou com um problema urgente no servidor. Ele não está respondendo.',
  'message',
  false
),
(
  (SELECT id FROM protocols WHERE assunto LIKE '%Chat ativo%' LIMIT 1),
  (SELECT id FROM users WHERE email = 'joao@demo.local'),
  'user',
  'Olá! Vou verificar o status do servidor agora mesmo. Pode me informar qual servidor específico?',
  'message',
  false
),
(
  (SELECT id FROM protocols WHERE assunto LIKE '%Chat ativo%' LIMIT 1),
  NULL,
  'client',
  'É o servidor de produção principal, IP 192.168.1.100',
  'message',
  false
);

-- 7. Insert Chat Sessions for active chats
INSERT INTO chat_sessions (protocol_id, client_online, agent_online, status) VALUES 
(
  (SELECT id FROM protocols WHERE chat_active = true AND assunto LIKE '%novo usuário%' LIMIT 1),
  false,
  true,
  'active'
),
(
  (SELECT id FROM protocols WHERE chat_active = true AND assunto LIKE '%Chat ativo%' LIMIT 1),
  true,
  true,
  'active'
);

-- 8. Insert some notification logs
INSERT INTO notifications_log (protocol_id, tipo, destinatario, conteudo, status, sent_at) VALUES 
(
  (SELECT id FROM protocols WHERE assunto LIKE '%impressora%' LIMIT 1),
  'email',
  'carlos@empresa.com',
  'Seu protocolo foi recebido e está sendo analisado pela equipe de TI.',
  'delivered',
  now() - interval '2 hours'
),
(
  (SELECT id FROM protocols WHERE assunto LIKE '%Chat ativo%' LIMIT 1),
  'push',
  'joao@demo.local',
  'Nova mensagem no chat do protocolo',
  'delivered',
  now() - interval '5 minutes'
);

-- Verification queries (run these to check if data was inserted correctly)
-- SELECT 'Tenants' as table_name, count(*) as count FROM tenants
-- UNION ALL
-- SELECT 'Departments', count(*) FROM departments
-- UNION ALL  
-- SELECT 'Users', count(*) FROM users
-- UNION ALL
-- SELECT 'Categories', count(*) FROM categories
-- UNION ALL
-- SELECT 'Protocols', count(*) FROM protocols
-- UNION ALL
-- SELECT 'Messages', count(*) FROM protocol_messages
-- UNION ALL
-- SELECT 'Chat Sessions', count(*) FROM chat_sessions;
