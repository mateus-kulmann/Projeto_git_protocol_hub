/*
  # Add document types to protocols

  1. Changes
    - Add `document_type` column to protocols table
    - Remove dependency on categories table for protocol creation
    - Update existing protocols with default document type

  2. Document Types
    - protocolo: Protocolo padrão
    - memorando: Memorando interno
    - circular: Circular informativa
    - processo_administrativo: Processo administrativo
    - oficio: Ofício oficial
    - protocolo_servidor: Protocolo de servidor
    - chamado_tecnico: Chamado técnico

  3. Migration Notes
    - Existing protocols will be marked as 'protocolo' type
    - Categories table remains for future use but is not required for protocol creation
*/

-- Add document_type column to protocols table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'protocols' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE protocols ADD COLUMN document_type text DEFAULT 'protocolo';
  END IF;
END $$;

-- Add check constraint for valid document types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'protocols_document_type_check'
  ) THEN
    ALTER TABLE protocols ADD CONSTRAINT protocols_document_type_check 
    CHECK (document_type IN (
      'protocolo',
      'memorando', 
      'circular',
      'processo_administrativo',
      'oficio',
      'protocolo_servidor',
      'chamado_tecnico'
    ));
  END IF;
END $$;

-- Update existing protocols to have default document type
UPDATE protocols 
SET document_type = 'protocolo' 
WHERE document_type IS NULL;

-- Make document_type NOT NULL after setting defaults
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'protocols' AND column_name = 'document_type' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE protocols ALTER COLUMN document_type SET NOT NULL;
  END IF;
END $$;
