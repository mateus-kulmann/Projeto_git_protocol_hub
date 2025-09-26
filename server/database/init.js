import Database from 'sqlite3';

const db = new Database.Database(':memory:');

// Promisify database methods for async/await
db.runAsync = function(sql, ...params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function(sql, ...params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function(err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function(sql, ...params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initDatabase = async () => {
  try {
    // Create tenants table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT UNIQUE,
        config TEXT DEFAULT '{}',
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'agent',
        department_id TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
      )
    `);

    // Create departments table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        parent_id TEXT,
        responsible_user_id TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (responsible_user_id) REFERENCES users(id)
      )
    `);

    // Create categories table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        department_id TEXT,
        auto_assign INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        sla_hours INTEGER DEFAULT 48,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
      )
    `);

    // Create protocols table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS protocols (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        number TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'medium',
        channel TEXT DEFAULT 'web',
        requester_name TEXT NOT NULL,
        requester_email TEXT,
        requester_phone TEXT,
        requester_cpf TEXT,
        current_department_id TEXT,
        assigned_user_id TEXT,
        category_id TEXT,
        chat_active INTEGER DEFAULT 0,
        client_online INTEGER DEFAULT 0,
        agent_online INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (current_department_id) REFERENCES departments(id),
        FOREIGN KEY (assigned_user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Create protocol_messages table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS protocol_messages (
        id TEXT PRIMARY KEY,
        protocol_id TEXT NOT NULL,
        user_id TEXT,
        sender_type TEXT DEFAULT 'agent',
        content TEXT NOT NULL,
        type TEXT DEFAULT 'message',
        attachments TEXT DEFAULT '[]',
        is_internal INTEGER DEFAULT 0,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (protocol_id) REFERENCES protocols(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create protocol_attachments table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS protocol_attachments (
        id TEXT PRIMARY KEY,
        protocol_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        type TEXT NOT NULL,
        uploaded_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (protocol_id) REFERENCES protocols(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Create notifications_log table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS notifications_log (
        id TEXT PRIMARY KEY,
        protocol_id TEXT NOT NULL,
        type TEXT NOT NULL,
        recipient TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'sent',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivered_at DATETIME,
        opened_at DATETIME,
        clicked_at DATETIME,
        FOREIGN KEY (protocol_id) REFERENCES protocols(id)
      )
    `);

    // Create chat_sessions table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        protocol_id TEXT UNIQUE NOT NULL,
        client_online INTEGER DEFAULT 0,
        agent_online INTEGER DEFAULT 0,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'inactive',
        FOREIGN KEY (protocol_id) REFERENCES protocols(id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export { db, initDatabase };
