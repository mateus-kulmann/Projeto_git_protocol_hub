import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await db.allAsync(`
      SELECT 
        c.*,
        d.name as department_name
      FROM categories c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.tenant_id = ?
      ORDER BY c.name
    `, req.user.tenant_id);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
