-- Verificar policies da tabela team_members
-- Execute no Supabase SQL Editor

-- 1. Ver todas as policies da tabela
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'team_members';

-- 2. Verificar se RLS está habilitado
SELECT 
  relname as tabela,
  relrowsecurity as rls_habilitado,
  relforcerowsecurity as rls_forcado
FROM pg_class 
WHERE relname = 'team_members';

-- 3. Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;
