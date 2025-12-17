-- DIAGNÓSTICO: Erros 406 nas tabelas profiles e team_members
-- Execute no Supabase SQL Editor - APENAS LEITURA, NÃO ALTERA NADA

-- ============================================
-- 1. VER POLÍTICAS ATUAIS DE PROFILES
-- ============================================
SELECT 
  'profiles' as tabela,
  policyname,
  cmd,
  qual as condicao_using,
  with_check as condicao_with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- ============================================
-- 2. VER POLÍTICAS ATUAIS DE TEAM_MEMBERS
-- ============================================
SELECT 
  'team_members' as tabela,
  policyname,
  cmd,
  qual as condicao_using,
  with_check as condicao_with_check
FROM pg_policies 
WHERE tablename = 'team_members';

-- ============================================
-- 3. VER ESTRUTURA DA TABELA PROFILES
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 4. VER ESTRUTURA DA TABELA TEAM_MEMBERS
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- ============================================
-- 5. VERIFICAR SEU USER_ID
-- ============================================
SELECT auth.uid() as seu_user_id;

-- ============================================
-- 6. TESTAR ACESSO A PROFILES (sem .single())
-- ============================================
SELECT *
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 7. TESTAR ACESSO A TEAM_MEMBERS (sem .single())
-- ============================================
SELECT *
FROM team_members
WHERE user_id = auth.uid();

-- ============================================
-- 8. VERIFICAR SE HÁ DUPLICATAS EM PROFILES
-- ============================================
SELECT id, COUNT(*) as total
FROM profiles
GROUP BY id
HAVING COUNT(*) > 1;

-- ============================================
-- 9. VERIFICAR SE HÁ DUPLICATAS EM TEAM_MEMBERS
-- ============================================
SELECT user_id, owner_id, COUNT(*) as total
FROM team_members
GROUP BY user_id, owner_id
HAVING COUNT(*) > 1;

-- ============================================
-- 10. VER FUNÇÃO is_team_member (se existir)
-- ============================================
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'is_team_member';
