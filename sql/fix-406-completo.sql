-- CORREÇÃO COMPLETA: Erros 406 em profiles, team_members e team_roles
-- Execute no Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR POLÍTICAS ATUAIS DE TEAM_ROLES
-- ============================================
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'team_roles';

-- ============================================
-- 2. CORRIGIR TEAM_ROLES (tabela global de roles)
-- ============================================

-- Habilitar RLS
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes
DROP POLICY IF EXISTS "team_roles_all" ON team_roles;
DROP POLICY IF EXISTS "team_roles_select" ON team_roles;
DROP POLICY IF EXISTS "team_roles_insert" ON team_roles;
DROP POLICY IF EXISTS "team_roles_update" ON team_roles;
DROP POLICY IF EXISTS "team_roles_delete" ON team_roles;

-- SELECT: Qualquer usuário autenticado pode ver os roles
-- (roles são globais/sistema, não pertencem a um usuário específico)
CREATE POLICY "team_roles_select"
ON team_roles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Qualquer usuário autenticado pode criar roles
CREATE POLICY "team_roles_insert"
ON team_roles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Qualquer usuário autenticado pode atualizar (apenas seus próprios na prática)
CREATE POLICY "team_roles_update"
ON team_roles FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- DELETE: Qualquer usuário autenticado pode deletar (apenas seus próprios na prática)
CREATE POLICY "team_roles_delete"
ON team_roles FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. RECRIAR POLÍTICAS DE PROFILES (mais simples)
-- ============================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- SELECT: Usuário vê próprio perfil OU membro vê perfil do owner
CREATE POLICY "profiles_select"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.owner_id = profiles.id
    AND tm.is_active = true
  )
);

-- INSERT: Apenas próprio perfil
CREATE POLICY "profiles_insert"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- UPDATE: Apenas próprio perfil
CREATE POLICY "profiles_update"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- 4. RECRIAR POLÍTICAS DE TEAM_MEMBERS
-- ============================================

DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- SELECT: Owner vê seus membros, membro vê a si mesmo
CREATE POLICY "team_members_select"
ON team_members FOR SELECT
USING (
  owner_id = auth.uid()
  OR user_id = auth.uid()
);

-- INSERT: Apenas owner
CREATE POLICY "team_members_insert"
ON team_members FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owner
CREATE POLICY "team_members_update"
ON team_members FOR UPDATE
USING (owner_id = auth.uid());

-- DELETE: Apenas owner
CREATE POLICY "team_members_delete"
ON team_members FOR DELETE
USING (owner_id = auth.uid());

-- ============================================
-- 5. VERIFICAR RESULTADO FINAL
-- ============================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'team_members', 'team_roles')
ORDER BY tablename, policyname;

-- ============================================
-- 6. TESTAR ACESSO (com seu usuário logado)
-- ============================================
SELECT 'profiles' as tabela, count(*) as registros FROM profiles WHERE id = auth.uid()
UNION ALL
SELECT 'team_members', count(*) FROM team_members WHERE owner_id = auth.uid() OR user_id = auth.uid()
UNION ALL
SELECT 'team_roles', count(*) FROM team_roles;
