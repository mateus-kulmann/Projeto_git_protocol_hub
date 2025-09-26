/*
  # Corrigir numeração de protocolos

  1. Alterações na tabela
    - Alterar coluna numero de integer para text
    - Criar função para gerar números no formato AAAAMMDD.NNNNNNNN
    - Criar trigger automático
    - Atualizar protocolos existentes

  2. Formato do número
    - AAAA = Ano (4 dígitos)
    - MM = Mês (2 dígitos)
    - DD = Dia (2 dígitos)
    - NNNNNNNN = Sequencial do dia (8 dígitos)
*/

-- Alterar a coluna numero para text
ALTER TABLE protocols ALTER COLUMN numero TYPE text;

-- Remover a constraint unique se existir
ALTER TABLE protocols DROP CONSTRAINT IF EXISTS protocols_numero_key;

-- Criar função para gerar número do protocolo
CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS text AS $$
DECLARE
    date_part text;
    next_seq integer;
    protocol_number text;
BEGIN
    -- Gerar parte da data (AAAAMMDD)
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Buscar próximo número sequencial para o dia
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 10) AS integer)), 0) + 1
    INTO next_seq
    FROM protocols 
    WHERE numero LIKE date_part || '.%';
    
    -- Gerar número completo
    protocol_number := date_part || '.' || LPAD(next_seq::text, 8, '0');
    
    RETURN protocol_number;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar número automaticamente
CREATE OR REPLACE FUNCTION set_protocol_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero := generate_protocol_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_set_protocol_number ON protocols;
CREATE TRIGGER trigger_set_protocol_number
    BEFORE INSERT ON protocols
    FOR EACH ROW
    EXECUTE FUNCTION set_protocol_number();

-- Atualizar protocolos existentes usando uma abordagem diferente
DO $$
DECLARE
    protocol_record RECORD;
    counter integer := 1;
    current_date_part text;
BEGIN
    current_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    FOR protocol_record IN 
        SELECT id FROM protocols ORDER BY created_at
    LOOP
        UPDATE protocols 
        SET numero = current_date_part || '.' || LPAD(counter::text, 8, '0')
        WHERE id = protocol_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Recriar constraint unique
ALTER TABLE protocols ADD CONSTRAINT protocols_numero_key UNIQUE (numero);
