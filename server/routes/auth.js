import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/init.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await db.getAsync(`
      SELECT u.*, d.name as department_name, t.name as tenant_name, t.config as tenant_config
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = ? AND u.active = 1
    `, email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      token,
      user: {
        ...userWithoutPassword,
        tenant_config: JSON.parse(user.tenant_config || '{}')
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
