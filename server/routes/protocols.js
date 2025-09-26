import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all protocols with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, department, channel, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.*,
        d.name as department_name,
        u.name as assigned_user_name,
        c.name as category_name,
        cs.client_online,
        cs.agent_online,
        cs.status as chat_status,
        (SELECT COUNT(*) FROM protocol_messages pm WHERE pm.protocol_id = p.id AND pm.read_at IS NULL AND pm.sender_type = 'client') as unread_count
      FROM protocols p
      LEFT JOIN departments d ON p.current_department_id = d.id
      LEFT JOIN users u ON p.assigned_user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN chat_sessions cs ON p.id = cs.protocol_id
      WHERE p.tenant_id = ?
    `;
    
    const params = [req.user.tenant_id];
    
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    
    if (department) {
      query += ` AND p.current_department_id = ?`;
      params.push(department);
    }
    
    if (channel) {
      query += ` AND p.channel = ?`;
      params.push(channel);
    }
    
    if (search) {
      query += ` AND (p.number LIKE ? OR p.requester_name LIKE ? OR p.subject LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const protocols = await db.allAsync(query, ...params);
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM protocols p WHERE p.tenant_id = ?`;
    const countResult = await db.getAsync(countQuery, req.user.tenant_id);
    
    res.json({
      protocols,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult.total / limit),
        total_count: countResult.total
      }
    });
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get single protocol with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const protocol = await db.getAsync(`
      SELECT 
        p.*,
        d.name as department_name,
        u.name as assigned_user_name,
        c.name as category_name,
        cs.client_online,
        cs.agent_online,
        cs.status as chat_status
      FROM protocols p
      LEFT JOIN departments d ON p.current_department_id = d.id
      LEFT JOIN users u ON p.assigned_user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN chat_sessions cs ON p.id = cs.protocol_id
      WHERE p.id = ? AND p.tenant_id = ?
    `, req.params.id, req.user.tenant_id);

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }

    // Get messages
    const messages = await db.allAsync(`
      SELECT 
        m.*,
        u.name as user_name
      FROM protocol_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.protocol_id = ?
      ORDER BY m.created_at ASC
    `, req.params.id);

    // Get attachments
    const attachments = await db.allAsync(`
      SELECT 
        a.*,
        u.name as uploaded_by_name
      FROM protocol_attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.protocol_id = ?
    `, req.params.id);

    res.json({
      protocol,
      messages: messages.map(msg => ({
        ...msg,
        attachments: JSON.parse(msg.attachments || '[]')
      })),
      attachments
    });
  } catch (error) {
    console.error('Error fetching protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create new protocol
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      subject,
      description,
      requester_name,
      requester_email,
      requester_phone,
      requester_cpf,
      category_id,
      priority = 'medium',
      channel = 'web'
    } = req.body;

    const protocolId = uuidv4();
    
    // Generate protocol number (year-sequential)
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const randomNumbers = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    const protocolNumber = `${year}${month}${day}.${randomNumbers}`;

    // Get category to auto-assign department
    const category = await db.getAsync(`
      SELECT * FROM categories WHERE id = ? AND tenant_id = ?
    `, category_id, req.user.tenant_id);

    await db.runAsync(`
      INSERT INTO protocols (
        id, tenant_id, number, subject, priority, channel,
        requester_name, requester_email, requester_phone, requester_cpf,
        current_department_id, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      protocolId, req.user.tenant_id, protocolNumber, subject, priority, channel,
      requester_name, requester_email, requester_phone, requester_cpf,
      category?.department_id || null, category_id
    );

    // Create initial system message
    await db.runAsync(`
      INSERT INTO protocol_messages (id, protocol_id, user_id, sender_type, content, type)
      VALUES (?, ?, ?, 'system', ?, 'system')
    `, uuidv4(), protocolId, req.user.id, `Protocolo criado por ${req.user.name}`);

    // Add initial description message if provided
    if (description && description.trim()) {
      await db.runAsync(`
        INSERT INTO protocol_messages (id, protocol_id, user_id, sender_type, content, type)
        VALUES (?, ?, ?, 'system', ?, 'message')
      `, uuidv4(), protocolId, req.user.id, description.trim());
    }

    res.status(201).json({
      id: protocolId,
      number: protocolNumber,
      message: 'Protocolo criado com sucesso'
    });
  } catch (error) {
    console.error('Error creating protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update protocol status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    await db.runAsync(`
      UPDATE protocols 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, status, req.params.id, req.user.tenant_id);

    // Always add a system message for status changes
    const messageContent = comment || `Status alterado para: ${status}`;
    await db.runAsync(`
      INSERT INTO protocol_messages (id, protocol_id, user_id, sender_type, content, type, is_internal)
      VALUES (?, ?, ?, 'system', ?, 'status_change', 0)
    `, uuidv4(), req.params.id, req.user.id, messageContent);

    res.json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating protocol status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Assign protocol to user
router.patch('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const assignedUserId = user_id === 'me' ? req.user.id : user_id;
    
    await db.runAsync(`
      UPDATE protocols 
      SET assigned_user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, assignedUserId, req.params.id, req.user.tenant_id);

    // Add system message
    await db.runAsync(`
      INSERT INTO protocol_messages (id, protocol_id, user_id, sender_type, content, type, is_internal)
      VALUES (?, ?, ?, 'system', ?, 'system', 1)
    `, uuidv4(), req.params.id, req.user.id, `Protocolo atribuído para ${req.user.name}`);

    res.json({ message: 'Protocolo atribuído com sucesso' });
  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Forward protocol to department
router.patch('/:id/forward', authenticateToken, async (req, res) => {
  try {
    const { department_id, assigned_user_id, comment } = req.body;
    
    await db.runAsync(`
      UPDATE protocols 
      SET current_department_id = ?, assigned_user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, department_id, assigned_user_id || null, req.params.id, req.user.tenant_id);

    // Add system message
    const department = await db.getAsync(`
      SELECT name FROM departments WHERE id = ?
    `, department_id);

    await db.runAsync(`
      INSERT INTO protocol_messages (id, protocol_id, user_id, sender_type, content, type, is_internal)
      VALUES (?, ?, ?, 'system', ?, 'system', 1)
    `, uuidv4(), req.params.id, req.user.id, `Protocolo encaminhado para ${department?.name || 'setor desconhecido'}: ${comment}`);

    res.json({ message: 'Protocolo encaminhado com sucesso' });
  } catch (error) {
    console.error('Error forwarding protocol:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
