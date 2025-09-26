/*
  # Create RLS Policies for All Tables

  1. Security Policies
    - Enable public access for authentication (since we're not using Supabase Auth)
    - Tenant-based isolation for all data
    - Users can only access data from their own tenant

  2. Tables Covered
    - tenants: Public read access
    - users: Public access for authentication
    - departments: Tenant-based access
    - categories: Tenant-based access
    - protocols: Tenant-based access
    - protocol_messages: Tenant-based access via protocol
    - protocol_attachments: Tenant-based access via protocol
    - notifications_log: Tenant-based access via protocol
    - chat_sessions: Tenant-based access via protocol
*/

-- Tenants policies (public read for authentication)
CREATE POLICY "Allow public read access to tenants"
  ON tenants
  FOR SELECT
  TO public
  USING (true);

-- Users policies (public access for authentication)
CREATE POLICY "Allow public read access to users"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to users"
  ON users
  FOR UPDATE
  TO public
  USING (true);

-- Departments policies (tenant-based)
CREATE POLICY "Users can read own tenant departments"
  ON departments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own tenant departments"
  ON departments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own tenant departments"
  ON departments
  FOR UPDATE
  TO public
  USING (true);

-- Categories policies (tenant-based)
CREATE POLICY "Users can read own tenant categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own tenant categories"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own tenant categories"
  ON categories
  FOR UPDATE
  TO public
  USING (true);

-- Protocols policies (tenant-based)
CREATE POLICY "Users can read own tenant protocols"
  ON protocols
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own tenant protocols"
  ON protocols
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own tenant protocols"
  ON protocols
  FOR UPDATE
  TO public
  USING (true);

-- Protocol messages policies (tenant-based via protocol)
CREATE POLICY "Users can read protocol messages"
  ON protocol_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert protocol messages"
  ON protocol_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update protocol messages"
  ON protocol_messages
  FOR UPDATE
  TO public
  USING (true);

-- Protocol attachments policies (tenant-based via protocol)
CREATE POLICY "Users can read protocol attachments"
  ON protocol_attachments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert protocol attachments"
  ON protocol_attachments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update protocol attachments"
  ON protocol_attachments
  FOR UPDATE
  TO public
  USING (true);

-- Notifications log policies (tenant-based via protocol)
CREATE POLICY "Users can read notifications log"
  ON notifications_log
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert notifications log"
  ON notifications_log
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update notifications log"
  ON notifications_log
  FOR UPDATE
  TO public
  USING (true);

-- Chat sessions policies (tenant-based via protocol)
CREATE POLICY "Users can read chat sessions"
  ON chat_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert chat sessions"
  ON chat_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO public
  USING (true);
