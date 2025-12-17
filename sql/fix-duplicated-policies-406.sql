-- CORREÇÃO: Remover políticas duplicadas que causam erro 406
-- Execute no Supabase SQL Editor

-- ============================================
-- 1. REMOVER POLÍTICAS DUPLICADAS (_simple)
-- ============================================
DROP POLICY IF EXISTS "team_members_delete_simple" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_simple" ON team_members;
DROP POLICY IF EXISTS "team_members_select_simple" ON team_members;
DROP POLICY IF EXISTS "team_members_update_simple" ON team_members;

-- ============================================
-- 2. VERIFICAR POLÍTICAS RESTANTES
-- ============================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'team_members')
ORDER BY tablename, policyname;

-- ============================================
-- 3. VERIFICAR DEFINIÇÃO DAS POLÍTICAS ATUAIS
-- ============================================
SELECT policyname, qual as condicao
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT policyname, qual as condicao
FROM pg_policies 
WHERE tablename = 'team_members';
