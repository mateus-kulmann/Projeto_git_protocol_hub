import jwt from 'jsonwebtoken';
import { db } from '../database/init.js';

const JWT_SECRET = 'your-secret-key-change-in-production';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await db.getAsync(`
      SELECT u.*, d.name as department_name, t.name as tenant_name
      , t.config as tenant_config
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ? AND u.active = 1
    `, decoded.userId);

    if (!user) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }

    req.user = {
      ...user,
      tenant_config: JSON.parse(user.tenant_config || '{}')
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};
