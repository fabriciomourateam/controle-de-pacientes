-- =====================================================
-- DIAGNÓSTICO: Estrutura da tabela checkin
-- =====================================================
-- Verificar quais colunas existem na tabela checkin
-- =====================================================

-- Ver todas as colunas da tabela checkin
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'checkin'
ORDER BY ordinal_position;

-- Ver se a tabela existe
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE '%checkin%';

-- Ver policies existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename LIKE '%checkin%';
