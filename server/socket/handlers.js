import { db } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join protocol room
    socket.on('join_protocol', async (data) => {
      const { protocol_id, user_id, user_type } = data;
      
      socket.join(protocol_id);
      socket.protocol_id = protocol_id;
      socket.user_id = user_id;
      socket.user_type = user_type;

      // Update chat session
      await db.runAsync(`
        INSERT OR REPLACE INTO chat_sessions (id, protocol_id, client_online, agent_online, last_activity, status)
        VALUES (
          COALESCE((SELECT id FROM chat_sessions WHERE protocol_id = ?), ?),
          ?,
          CASE WHEN ? = 'client' THEN 1 ELSE COALESCE((SELECT client_online FROM chat_sessions WHERE protocol_id = ?), 0) END,
          CASE WHEN ? = 'agent' THEN 1 ELSE COALESCE((SELECT agent_online FROM chat_sessions WHERE protocol_id = ?), 0) END,
          CURRENT_TIMESTAMP,
          'active'
        )
      `, protocol_id, uuidv4(), protocol_id, user_type, protocol_id, user_type, protocol_id);

      // Notify others in room about online status
      socket.to(protocol_id).emit('user_online', {
        user_id,
        user_type,
        protocol_id
      });
    });

    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const { protocol_id, content, sender_type = 'agent', attachments = [] } = data;
        
        const messageId = uuidv4();
        
        await db.runAsync(`
          INSERT INTO protocol_messages (
            id, protocol_id, user_id, sender_type, content, type, attachments
          ) VALUES (?, ?, ?, ?, ?, 'message', ?)
        `, messageId, protocol_id, socket.user_id, sender_type, content, JSON.stringify(attachments));

        // Update protocol timestamp
        await db.runAsync(`
          UPDATE protocols 
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, protocol_id);

        // Get message with user info
        const message = await db.getAsync(`
          SELECT 
            m.*,
            u.name as user_name
          FROM protocol_messages m
          LEFT JOIN users u ON m.user_id = u.id
          WHERE m.id = ?
        `, messageId);

        const messageData = {
          ...message,
          attachments: JSON.parse(message.attachments || '[]')
        };

        // Send to all clients in protocol room
        io.to(protocol_id).emit('new_message', messageData);

        // Send notification to offline users
        socket.to(protocol_id).emit('new_notification', {
          type: 'message',
          protocol_id,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          sender_name: socket.user_type === 'agent' ? message.user_name : 'Cliente'
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Erro ao enviar mensagem' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.protocol_id).emit('user_typing', {
        user_id: socket.user_id,
        user_type: socket.user_type,
        protocol_id: data.protocol_id
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.protocol_id).emit('user_stop_typing', {
        user_id: socket.user_id,
        user_type: socket.user_type,
        protocol_id: data.protocol_id
      });
    });

    // Handle leaving protocol room
    socket.on('leave_protocol', async (data) => {
      const { protocol_id } = data;
      
      socket.leave(protocol_id);
      
      // Update chat session to mark user as offline
      if (socket.user_type) {
        const updateField = socket.user_type === 'client' ? 'client_online' : 'agent_online';
        
        await db.runAsync(`
          UPDATE chat_sessions 
          SET ${updateField} = 0, last_activity = CURRENT_TIMESTAMP
          WHERE protocol_id = ?
        `, protocol_id);

        // Notify others in room about offline status
        socket.to(protocol_id).emit('user_offline', {
          user_id: socket.user_id,
          user_type: socket.user_type,
          protocol_id: protocol_id
        });
      }
    });

    // Handle chat activation/deactivation
    socket.on('toggle_chat', async (data) => {
      try {
        const { protocol_id, active } = data;
        
        await db.runAsync(`
          UPDATE protocols 
          SET chat_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND tenant_id = ?
        `, active ? 1 : 0, protocol_id, socket.user_tenant_id);

        // Notify all users in protocol room
        io.to(protocol_id).emit('chat_status_changed', {
          protocol_id,
          active,
          changed_by: socket.user_id
        });

      } catch (error) {
        console.error('Error toggling chat:', error);
        socket.emit('chat_error', { error: 'Erro ao alterar status do chat' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.protocol_id && socket.user_id) {
        // Update offline status
        const updateField = socket.user_type === 'client' ? 'client_online' : 'agent_online';
        
        await db.runAsync(`
          UPDATE chat_sessions 
          SET ${updateField} = 0, last_activity = CURRENT_TIMESTAMP
          WHERE protocol_id = ?
        `, socket.protocol_id);

        // Notify others in room about offline status
        socket.to(socket.protocol_id).emit('user_offline', {
          user_id: socket.user_id,
          user_type: socket.user_type,
          protocol_id: socket.protocol_id
        });
      }
    });
  });
};
