/*
  # Criar tabela de solicitantes

  1. Nova Tabela
    - `solicitantes`
      - `id` (uuid, primary key)
      - `tipo` (text, 'pessoa_fisica' ou 'pessoa_juridica')
      - `nome_completo` (text, para PF)
      - `razao_social` (text, para PJ)
      - `cpf` (text, para PF)
      - `cnpj` (text, para PJ)
      - `email` (text)
      - `telefone` (text)
      - `endereco` (text, opcional)
      - `pessoa_juridica_id` (uuid, para vincular PF a PJ)
      - `ativo` (boolean)
      - `tenant_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `solicitantes`
    - Adicionar políticas para usuários autenticados lerem/criarem/editarem solicitantes do seu tenant
*/

CREATE TABLE IF NOT EXISTS solicitantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica')),
  nome_completo text,
  razao_social text,
  cpf text,
  cnpj text,
  email text,
  telefone text,
  endereco text,
  pessoa_juridica_id uuid REFERENCES solicitantes(id) ON DELETE SET NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitantes_tenant_id ON solicitantes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_solicitantes_tipo ON solicitantes(tipo);
CREATE INDEX IF NOT EXISTS idx_solicitantes_cpf ON solicitantes(cpf);
CREATE INDEX IF NOT EXISTS idx_solicitantes_cnpj ON solicitantes(cnpj);
CREATE INDEX IF NOT EXISTS idx_solicitantes_email ON solicitantes(email);
CREATE INDEX IF NOT EXISTS idx_solicitantes_pessoa_juridica_id ON solicitantes(pessoa_juridica_id);

-- Constraints para garantir dados obrigatórios
ALTER TABLE solicitantes ADD CONSTRAINT check_pessoa_fisica_required 
  CHECK (
    tipo != 'pessoa_fisica' OR 
    (nome_completo IS NOT NULL AND cpf IS NOT NULL AND (email IS NOT NULL OR telefone IS NOT NULL))
  );

ALTER TABLE solicitantes ADD CONSTRAINT check_pessoa_juridica_required 
  CHECK (
    tipo != 'pessoa_juridica' OR 
    (razao_social IS NOT NULL AND cnpj IS NOT NULL AND (email IS NOT NULL OR telefone IS NOT NULL))
  );

-- Constraint para evitar vinculação circular
ALTER TABLE solicitantes ADD CONSTRAINT check_no_circular_reference 
  CHECK (pessoa_juridica_id != id);

-- Habilitar RLS
ALTER TABLE solicitantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can read solicitantes from their tenant"
  ON solicitantes
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT users.tenant_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert solicitantes to their tenant"
  ON solicitantes
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT users.tenant_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update solicitantes from their tenant"
  ON solicitantes
  FOR UPDATE
  TO authenticated
  USING (tenant_id IN (
    SELECT users.tenant_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete solicitantes from their tenant"
  ON solicitantes
  FOR DELETE
  TO authenticated
  USING (tenant_id IN (
    SELECT users.tenant_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_solicitantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_solicitantes_updated_at
  BEFORE UPDATE ON solicitantes
  FOR EACH ROW
  EXECUTE FUNCTION update_solicitantes_updated_at();