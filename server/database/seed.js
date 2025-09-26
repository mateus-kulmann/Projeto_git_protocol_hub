import { db } from './init.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists
    const existingUsers = await db.getAsync('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers && existingUsers.count > 0) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    // Create tenant
    const tenantId = uuidv4();
    await db.runAsync(`
      INSERT INTO tenants (id, name, domain, active) 
      VALUES (?, ?, ?, ?)
    `, tenantId, 'Demo Company', 'demo.local', 1);
    console.log('✅ Tenant created');

    // Create departments
    const itDeptId = uuidv4();
    const hrDeptId = uuidv4();
    const financeDeptId = uuidv4();
    
    await db.runAsync(`
      INSERT INTO departments (id, tenant_id, name, description, active) 
      VALUES (?, ?, ?, ?, ?)
    `, itDeptId, tenantId, 'TI', 'Tecnologia da Informação', 1);
    
    await db.runAsync(`
      INSERT INTO departments (id, tenant_id, name, description, active) 
      VALUES (?, ?, ?, ?, ?)
    `, hrDeptId, tenantId, 'RH', 'Recursos Humanos', 1);
    
    await db.runAsync(`
      INSERT INTO departments (id, tenant_id, name, description, active) 
      VALUES (?, ?, ?, ?, ?)
    `, financeDeptId, tenantId, 'Financeiro', 'Departamento Financeiro', 1);
    
    console.log('✅ Departments created');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminId = uuidv4();
    await db.runAsync(`
      INSERT INTO users (id, tenant_id, name, email, password, role, department_id, active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, adminId, tenantId, 'Administrador', 'admin@demo.local', hashedPassword, 'admin', itDeptId, 1);
    
    // Create additional users
    const joaoPassword = await bcrypt.hash('admin123', 10);
    const mariaPassword = await bcrypt.hash('admin123', 10);
    
    const joaoId = uuidv4();
    await db.runAsync(`
      INSERT INTO users (id, tenant_id, name, email, password, role, department_id, active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, joaoId, tenantId, 'João Silva', 'joao@demo.local', joaoPassword, 'agent', itDeptId, 1);
    
    const mariaId = uuidv4();
    await db.runAsync(`
      INSERT INTO users (id, tenant_id, name, email, password, role, department_id, active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, mariaId, tenantId, 'Maria Santos', 'maria@demo.local', mariaPassword, 'agent', hrDeptId, 1);
    
    console.log('✅ Users created');

    // Create categories
    const techSupportId = uuidv4();
    await db.runAsync(`
      INSERT INTO categories (id, tenant_id, name, department_id, auto_assign, priority, sla_hours) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, techSupportId, tenantId, 'Suporte Técnico', itDeptId, 1, 'medium', 24);
    
    const accessRequestId = uuidv4();
    await db.runAsync(`
      INSERT INTO categories (id, tenant_id, name, department_id, auto_assign, priority, sla_hours) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, accessRequestId, tenantId, 'Solicitação de Acesso', hrDeptId, 0, 'low', 48);
    
    console.log('✅ Categories created');

    // Create sample protocols
    const protocol1Id = uuidv4();
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const randomNumbers1 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const protocol1Number = `${year}${month}${day}.${randomNumbers1}`;
    
    await db.runAsync(`
      INSERT INTO protocols (
        id, tenant_id, number, subject, status, priority, channel, 
        requester_name, requester_email, requester_phone, 
        current_department_id, assigned_user_id, category_id, chat_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, protocol1Id,
      tenantId,
      protocol1Number,
      'Problema com impressora',
      'open',
      'medium',
      'email',
      'João Silva',
      'joao@demo.local',
      '(11) 99999-9999',
      itDeptId,
      adminId,
      techSupportId,
      0
    );
    
    const protocol2Id = uuidv4();
    const randomNumbers2 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const protocol2Number = `${year}${month}${day}.${randomNumbers2}`;
    
    await db.runAsync(`
      INSERT INTO protocols (
        id, tenant_id, number, subject, status, priority, channel, 
        requester_name, requester_email, requester_phone, 
        current_department_id, assigned_user_id, category_id, chat_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, protocol2Id,
      tenantId,
      protocol2Number,
      'Solicitação de novo usuário',
      'in_progress',
      'low',
      'portal',
      'Maria Santos',
      'maria@demo.local',
      '(11) 88888-8888',
      hrDeptId,
      adminId,
      accessRequestId,
      1
    );
    
    console.log('✅ Sample protocols created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📧 Login credentials: admin@demo.local / admin123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
