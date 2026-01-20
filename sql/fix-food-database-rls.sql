-- Corrigir políticas RLS da tabela food_database
-- Execute este script no SQL Editor do Supabase

-- 1. Remover todas as políticas existentes da tabela food_database
DROP POLICY IF EXISTS "Usuários autenticados podem ver alimentos" ON food_database;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir alimentos" ON food_database;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar alimentos" ON food_database;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar alimentos" ON food_database;
DROP POLICY IF EXISTS "Users can view food database" ON food_database;
DROP POLICY IF EXISTS "Users can insert food database" ON food_database;
DROP POLICY IF EXISTS "Users can update food database" ON food_database;
DROP POLICY IF EXISTS "Users can delete food database" ON food_database;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON food_database;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON food_database;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON food_database;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON food_database;

-- 2. Habilitar RLS na tabela
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas simples e permissivas
-- A tabela food_database é um banco de dados compartilhado (TACO)
-- Todos os usuários autenticados devem poder ler
-- Apenas admins devem poder modificar

-- SELECT: Todos os usuários autenticados podem ler
CREATE POLICY "Todos podem ver alimentos ativos"
ON food_database
FOR SELECT
TO authenticated
USING (is_active = true);

-- INSERT: Apenas service_role (para importação TACO)
CREATE POLICY "Service role pode inserir alimentos"
ON food_database
FOR INSERT
TO service_role
WITH CHECK (true);

-- UPDATE: Apenas service_role
CREATE POLICY "Service role pode atualizar alimentos"
ON food_database
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- DELETE: Apenas service_role
CREATE POLICY "Service role pode deletar alimentos"
ON food_database
FOR DELETE
TO service_role
USING (true);

-- 4. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'food_database'
ORDER BY policyname;

-- 5. Testar acesso (deve retornar alimentos)
SELECT COUNT(*) as total_alimentos_visiveis
FROM food_database
WHERE is_active = true;
