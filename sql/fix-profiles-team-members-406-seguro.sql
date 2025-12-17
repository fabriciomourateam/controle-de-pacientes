-- CORREÇÃO SEGURA: Erros 406 nas tabelas profiles e team_members
-- NÃO ALTERA acessos existentes - apenas adiciona políticas que faltam
-- Execute no Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR POLÍTICAS ATUAIS (APENAS DIAGNÓSTICO)
-- ============================================
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'team_members');

-- ============================================
-- 2. CORRIGIR POLÍTICAS DA TABELA PROFILES
-- Mantém acesso do dono + permite membro ver perfil do dono
-- ============================================

-- Dropar apenas políticas problemáticas (que podem causar 406)
DROP POLICY IF EXISTS "profiles_all" ON profiles;

-- Habilitar RLS (se não estiver)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuário vê próprio perfil OU membro vê perfil do dono
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select"
ON profiles FOR SELECT
USING (
  id = auth.uid()  -- Usuário vê próprio perfil
  OR EXISTS (      -- Membro vê perfil do dono da equipe
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.owner_id = profiles.id
    AND tm.is_active = true
  )
);

-- Política INSERT: Apenas próprio perfil
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Política UPDATE: Apenas próprio perfil
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- 3. CORRIGIR POLÍTICAS DA TABELA TEAM_MEMBERS
-- Mantém acesso do owner + membro vê a si mesmo
-- ============================================

-- Dropar apenas políticas problemáticas
DROP POLICY IF EXISTS "team_members_all" ON team_members;

-- Habilitar RLS (se não estiver)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Owner vê seus membros, membro vê a si mesmo
DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select"
ON team_members FOR SELECT
USING (
  owner_id = auth.uid()   -- Owner vê todos os seus membros
  OR user_id = auth.uid() -- Membro vê a si mesmo
);

-- Política INSERT: Apenas owner pode adicionar
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert"
ON team_members FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Política UPDATE: Owner pode atualizar seus membros
DROP POLICY IF EXISTS "team_members_update" ON team_members;
CREATE POLICY "team_members_update"
ON team_members FOR UPDATE
USING (owner_id = auth.uid());

-- Política DELETE: Owner pode remover seus membros
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete"
ON team_members FOR DELETE
USING (owner_id = auth.uid());

-- ============================================
-- 4. VERIFICAR RESULTADO
-- ============================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'team_members')
ORDER BY tablename, policyname;
