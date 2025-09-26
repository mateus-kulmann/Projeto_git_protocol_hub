import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const departments = await db.allAsync(`
      SELECT 
        d.*,
        u.name as responsible_name,
        (SELECT COUNT(*) FROM protocols p WHERE p.current_department_id = d.id AND p.status != 'closed') as active_protocols
      FROM departments d
      LEFT JOIN users u ON d.responsible_user_id = u.id
      WHERE d.tenant_id = ? AND d.active = 1
      ORDER BY d.name
    `, req.user.tenant_id);

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create department
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { name, description, parent_id, responsible_user_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const departmentId = uuidv4();
    
    await db.runAsync(`
      INSERT INTO departments (id, tenant_id, name, description, parent_id, responsible_user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, departmentId, req.user.tenant_id, name, description, parent_id, responsible_user_id);

    res.status(201).json({
      id: departmentId,
      message: 'Departamento criado com sucesso'
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
