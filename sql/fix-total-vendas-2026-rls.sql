-- =====================================================
-- ADICIONAR POLÍTICAS RLS PARA TABELA "Total de Vendas 2026"
-- =====================================================
-- Este script adiciona políticas RLS para a tabela "Total de Vendas 2026"
-- seguindo o mesmo padrão da tabela "Total de Vendas"
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Verificar se a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Total de Vendas 2026'
  ) THEN
    RAISE EXCEPTION 'Tabela "Total de Vendas 2026" não encontrada!';
  END IF;
END $$;

-- 2. Habilitar RLS na tabela
ALTER TABLE "Total de Vendas 2026" ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "total_vendas_2026_all" ON "Total de Vendas 2026";
DROP POLICY IF EXISTS "Users can only see their own vendas 2026" ON "Total de Vendas 2026";
DROP POLICY IF EXISTS "Users can only insert their own vendas 2026" ON "Total de Vendas 2026";
DROP POLICY IF EXISTS "Users can only update their own vendas 2026" ON "Total de Vendas 2026";
DROP POLICY IF EXISTS "Users can only delete their own vendas 2026" ON "Total de Vendas 2026";

-- 4. Verificar se a tabela tem coluna user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Total de Vendas 2026' 
    AND column_name = 'user_id'
  ) THEN
    -- Adicionar coluna user_id se não existir
    ALTER TABLE "Total de Vendas 2026" 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
    
    RAISE NOTICE 'Coluna user_id adicionada à tabela "Total de Vendas 2026"';
  END IF;
END $$;

-- 5. A função is_team_member já deve existir no banco
-- Se não existir, crie-a manualmente ou execute o script fix-all-tables-team-access.sql primeiro
-- A função deve ter a assinatura: is_team_member(owner_user_id UUID)

-- 6. Criar políticas RLS
-- SELECT: Usuário vê suas próprias vendas OU membro vê vendas do owner
CREATE POLICY "total_vendas_2026_select" ON "Total de Vendas 2026"
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_team_member(user_id)
  );

-- INSERT: Usuário pode inserir vendas com seu próprio user_id
CREATE POLICY "total_vendas_2026_insert" ON "Total de Vendas 2026"
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Usuário pode atualizar suas próprias vendas OU membro pode atualizar vendas do owner
CREATE POLICY "total_vendas_2026_update" ON "Total de Vendas 2026"
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR is_team_member(user_id)
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR is_team_member(user_id)
  );

-- DELETE: Usuário pode deletar suas próprias vendas OU membro pode deletar vendas do owner
CREATE POLICY "total_vendas_2026_delete" ON "Total de Vendas 2026"
  FOR DELETE
  USING (
    user_id = auth.uid() 
    OR is_team_member(user_id)
  );

-- 7. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'Total de Vendas 2026'
ORDER BY policyname;

-- 8. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'Total de Vendas 2026';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
