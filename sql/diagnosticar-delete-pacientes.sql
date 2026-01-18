-- ============================================
-- DIAGNÓSTICO: Verificar estrutura da tabela team_members
-- ============================================

-- 1. Ver todas as colunas da tabela team_members
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- 2. Ver políticas atuais de DELETE na tabela patients
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'patients'
ORDER BY cmd, policyname;

-- 3. Verificar se a tabela team_members existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'team_members'
) as team_members_exists;
