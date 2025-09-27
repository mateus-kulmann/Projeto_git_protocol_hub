/*
  # Adicionar campo requester_cnpj à tabela protocols

  1. Alterações na Tabela
    - Adicionar coluna `requester_cnpj` à tabela `protocols`
    - Campo opcional para armazenar CNPJ quando o solicitante for pessoa jurídica

  2. Observações
    - Campo opcional pois nem todos os protocolos terão CNPJ
    - Mantém compatibilidade com protocolos existentes
*/

-- Adicionar coluna requester_cnpj se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'protocols' AND column_name = 'requester_cnpj'
  ) THEN
    ALTER TABLE protocols ADD COLUMN requester_cnpj text;
  END IF;
END $$;