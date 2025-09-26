/*
  # Adicionar coluna telefone na tabela users

  1. Alterações na Tabela
    - `users`
      - Adicionar coluna `telefone` (text, opcional)

  2. Segurança
    - Nenhuma alteração nas políticas RLS necessária
    - A coluna herda as mesmas permissões da tabela

  3. Notas
    - Campo opcional para armazenar telefone dos usuários
    - Útil para contato e notificações futuras
*/

-- Adicionar coluna telefone na tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telefone'
  ) THEN
    ALTER TABLE users ADD COLUMN telefone text;
  END IF;
END $$;
