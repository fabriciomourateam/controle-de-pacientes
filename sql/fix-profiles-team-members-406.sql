-- CORREÇÃO: Erros 406 nas tabelas profiles e team_members
-- Execute no Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR POLÍTICAS ATUAIS
-- ============================================
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'team_members');

-- ============================================
-- 2. CORRIGIR POLÍTICAS DA TABELA PROFILES
-- ============================================

-- Dropar políticas existentes
DROP POLICY IF EXISTS "profiles_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar política SELECT simples (sem recursão)
CREATE POLICY "profiles_select"
ON profiles FOR SELECT
USING (
  id = auth.uid()
);

-- Criar política INSERT
CREATE POLICY "profiles_insert"
ON profiles FOR INSERT
WITH CHECK (
  id = auth.uid()
);

-- Criar política UPDATE
CREATE POLICY "profiles_update"
ON profiles FOR UPDATE
USING (
  id = auth.uid()
);

-- ============================================
-- 3. CORRIGIR POLÍTICAS DA TABELA TEAM_MEMBERS
-- ============================================

-- Dropar políticas existentes
DROP POLICY IF EXISTS "team_members_all" ON team_members;
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- Habilitar RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Criar política SELECT (owner vê seus membros, membro vê a si mesmo)
CREATE POLICY "team_members_select"
ON team_members FOR SELECT
USING (
  owner_id = auth.uid()  -- Owner vê todos os seus membros
  OR user_id = auth.uid() -- Membro vê a si mesmo
);

-- Criar política INSERT (apenas owner pode adicionar membros)
CREATE POLICY "team_members_insert"
ON team_members FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
);

-- Criar política UPDATE (owner pode atualizar seus membros)
CREATE POLICY "team_members_update"
ON team_members FOR UPDATE
USING (
  owner_id = auth.uid()
);

-- Criar política DELETE (owner pode remover seus membros)
CREATE POLICY "team_members_delete"
ON team_members FOR DELETE
USING (
  owner_id = auth.uid()
);

-- ============================================
-- 4. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ============================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'team_members');

-- ============================================
-- 5. TESTAR ACESSO
-- ============================================
-- Testar profiles
SELECT * FROM profiles WHERE id = auth.uid();

-- Testar team_members
SELECT * FROM team_members WHERE user_id = auth.uid() OR owner_id = auth.uid();
