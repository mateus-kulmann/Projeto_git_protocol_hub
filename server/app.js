import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// In-memory data store (replacing database for simplicity)
const users = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@demo.local',
    password: 'admin123',
    role: 'admin',
    tenant_id: '1',
    department_id: '1',
    department_name: 'TI',
    tenant_name: 'Demo Company',
    tenant_config: {}
  }
];

const protocols = [
  {
    id: '1',
    number: '20250101.00000001',
    subject: 'Problema com impressora',
    status: 'open',
    priority: 'medium',
    channel: 'email',
    requester_name: 'João Silva',
    requester_email: 'joao@demo.local',
    requester_phone: '(11) 99999-9999',
    department_name: 'TI',
    assigned_user_name: 'Administrador',
    chat_active: 0,
    client_online: 0,
    agent_online: 0,
    unread_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    number: '20250101.00000002',
    subject: 'Solicitação de novo usuário',
    status: 'in_progress',
    priority: 'low',
    channel: 'portal',
    requester_name: 'Maria Santos',
    requester_email: 'maria@demo.local',
    requester_phone: '(11) 88888-8888',
    department_name: 'RH',
    assigned_user_name: 'Administrador',
    chat_active: 1,
    client_online: 0,
    agent_online: 0,
    unread_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const messages = [
  {
    id: '1',
    protocol_id: '1',
    user_id: '1',
    sender_type: 'system',
    content: 'Protocolo criado por Administrador',
    type: 'system',
    attachments: [],
    is_internal: 0,
    read_at: null,
    created_at: new Date().toISOString(),
    user_name: 'Sistema'
  },
  {
    id: '2',
    protocol_id: '2',
    user_id: '1',
    sender_type: 'agent',
    content: 'Olá! Recebemos sua solicitação e já estamos analisando.',
    type: 'message',
    attachments: [],
    is_internal: 0,
    read_at: null,
    created_at: new Date().toISOString(),
    user_name: 'Administrador'
  }
];

const categories = [
  { id: '1', name: 'Suporte Técnico', department_name: 'TI' },
  { id: '2', name: 'Solicitação de Acesso', department_name: 'RH' }
];

const departments = [
  { id: '1', name: 'TI', description: 'Tecnologia da Informação', active_protocols: 1 },
  { id: '2', name: 'RH', description: 'Recursos Humanos', active_protocols: 1 }
];

// Simple password comparison (in production, use bcrypt)
const comparePassword = (plain, hashed) => {
  // For demo purposes, just check if plain text matches 'admin123'
  return plain === 'admin123';
};

// Generate simple JWT token (in production, use proper JWT library)
const generateToken = (userId) => {
  return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64');
};

// Verify token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Date.now()) {
      return res.status(403).json({ error: 'Token expirado' });
    }
    
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'ProtocolHub API Server', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      protocols: '/api/protocols',
      categories: '/api/categories',
      departments: '/api/departments',
      messages: '/api/messages'
    }
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!comparePassword(password, user.password)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Protocol routes
app.get('/api/protocols', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    let filteredProtocols = [...protocols];
    
    if (status) {
      filteredProtocols = filteredProtocols.filter(p => p.status === status);
    }
    
    if (search) {
      filteredProtocols = filteredProtocols.filter(p => 
        p.number.includes(search) || 
        p.requester_name.toLowerCase().includes(search.toLowerCase()) ||
        p.subject.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json({
      protocols: filteredProtocols,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(filteredProtocols.length / limit),
        total_count: filteredProtocols.length
      }
    });
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/protocols/:id', authenticateToken, (req, res) => {
  try {
    const protocol = protocols.find(p => p.id === req.params.id);
    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }

    const protocolMessages = messages.filter(m => m.protocol_id === req.params.id);
    
    res.json({
      protocol,
      messages: protocolMessages,
      attachments: []
    });
  } catch (error) {
    console.error('Error fetching protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/protocols', authenticateToken, (req, res) => {
  try {
    const {
      subject,
      requester_name,
      requester_email,
      requester_phone,
      category_id,
      priority = 'medium',
      channel = 'web'
    } = req.body;

    const newProtocol = {
      id: String(protocols.length + 1),
      number: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}.${String(protocols.length + 1).padStart(8, '0')}`,
      subject,
      status: 'open',
      priority,
      channel,
      requester_name,
      requester_email,
      requester_phone,
      department_name: 'TI',
      assigned_user_name: null,
      chat_active: 0,
      client_online: 0,
      agent_online: 0,
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    protocols.push(newProtocol);

    res.status(201).json({
      id: newProtocol.id,
      number: newProtocol.number,
      message: 'Protocolo criado com sucesso'
    });
  } catch (error) {
    console.error('Error creating protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/protocols/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, comment } = req.body;
    const protocol = protocols.find(p => p.id === req.params.id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }
    
    protocol.status = status;
    protocol.updated_at = new Date().toISOString();

    // Add system message
    const newMessage = {
      id: String(messages.length + 1),
      protocol_id: req.params.id,
      user_id: req.user.id,
      sender_type: 'system',
      content: comment || `Status alterado para: ${status}`,
      type: 'status_change',
      attachments: [],
      is_internal: 0,
      read_at: null,
      created_at: new Date().toISOString(),
      user_name: 'Sistema'
    };
    
    messages.push(newMessage);

    res.json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating protocol status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/protocols/:id/assign', authenticateToken, (req, res) => {
  try {
    const protocol = protocols.find(p => p.id === req.params.id);
    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }
    
    protocol.assigned_user_name = req.user.name;
    protocol.updated_at = new Date().toISOString();

    res.json({ message: 'Protocolo atribuído com sucesso' });
  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/protocols/:id/forward', authenticateToken, (req, res) => {
  try {
    const { department_id, comment } = req.body;
    const protocol = protocols.find(p => p.id === req.params.id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }
    
    const department = departments.find(d => d.id === department_id);
    protocol.department_name = department?.name || 'Setor desconhecido';
    protocol.updated_at = new Date().toISOString();

    res.json({ message: 'Protocolo encaminhado com sucesso' });
  } catch (error) {
    console.error('Error forwarding protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Message routes
app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const { protocol_id, content, type = 'message', is_internal = 0 } = req.body;

    if (!protocol_id || !content) {
      return res.status(400).json({ error: 'Protocol ID e conteúdo são obrigatórios' });
    }

    const newMessage = {
      id: String(messages.length + 1),
      protocol_id,
      user_id: req.user.id,
      sender_type: 'agent',
      content,
      type,
      attachments: [],
      is_internal,
      read_at: null,
      created_at: new Date().toISOString(),
      user_name: req.user.name
    };

    messages.push(newMessage);

    // Update protocol timestamp
    const protocol = protocols.find(p => p.id === protocol_id);
    if (protocol) {
      protocol.updated_at = new Date().toISOString();
    }

    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Categories routes
app.get('/api/categories', authenticateToken, (req, res) => {
  res.json(categories);
});

// Departments routes
app.get('/api/departments', authenticateToken, (req, res) => {
  res.json(departments);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_protocol', (data) => {
    const { protocol_id } = data;
    socket.join(protocol_id);
    console.log(`Socket ${socket.id} joined protocol ${protocol_id}`);
  });

  socket.on('send_message', (data) => {
    const { protocol_id, content, sender_type = 'agent' } = data;
    
    const newMessage = {
      id: String(messages.length + 1),
      protocol_id,
      user_id: socket.user_id || '1',
      sender_type,
      content,
      type: 'message',
      attachments: [],
      is_internal: 0,
      read_at: null,
      created_at: new Date().toISOString(),
      user_name: sender_type === 'agent' ? 'Agente' : 'Cliente'
    };

    messages.push(newMessage);
    io.to(protocol_id).emit('new_message', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Login credentials: admin@demo.local / admin123`);
});
