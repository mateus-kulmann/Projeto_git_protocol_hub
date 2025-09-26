import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { protocol_id, content, type = 'message', is_internal = 0 } = req.body;

    if (!protocol_id || !content) {
      return res.status(400).json({ error: 'Protocol ID e conteúdo são obrigatórios' });
    }

    const messageId = uuidv4();
    
    await db.runAsync(`
      INSERT INTO protocol_messages (
        id, protocol_id, user_id, sender_type, content, type, is_internal
      ) VALUES (?, ?, ?, 'agent', ?, ?, ?)
    `, messageId, protocol_id, req.user.id, content, type, is_internal);

    // Update protocol timestamp
    await db.runAsync(`
      UPDATE protocols 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, protocol_id, req.user.tenant_id);

    // Get the created message with user info
    const message = await db.getAsync(`
      SELECT 
        m.*,
        u.name as user_name
      FROM protocol_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `, messageId);

    res.status(201).json({
      message: {
        ...message,
        attachments: JSON.parse(message.attachments || '[]')
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mark messages as read
router.patch('/read', authenticateToken, async (req, res) => {
  try {
    const { message_ids } = req.body;

    if (!Array.isArray(message_ids)) {
      return res.status(400).json({ error: 'message_ids deve ser um array' });
    }

    const placeholders = message_ids.map(() => '?').join(',');
    
    await db.runAsync(`
      UPDATE protocol_messages 
      SET read_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders}) AND read_at IS NULL
    `, ...message_ids);

    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
