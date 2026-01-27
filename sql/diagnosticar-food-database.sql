-- =====================================================
-- DIAGNÓSTICO: Estrutura da tabela food_database
-- =====================================================
-- Verificar colunas e estrutura antes de criar policies
-- =====================================================

-- Ver estrutura completa da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'food_database'
ORDER BY ordinal_position;

-- Ver policies existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'food_database';

-- Ver se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'food_database';
