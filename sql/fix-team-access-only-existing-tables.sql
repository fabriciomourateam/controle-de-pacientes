-- ============================================================================
-- SQL SIMPLIFICADO - APENAS TABELAS QUE EXISTEM
-- ============================================================================
-- Este script corrige RLS apenas para as tabelas essenciais do sistema de equipe
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================================================

-- PASSO 1: Remover políticas RLS existentes (apenas tabelas que existem)
-- ============================================================================

-- Remover políticas da tabela team_members
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

-- Remover políticas da tabela team_roles
DROP POLICY IF EXISTS "team_roles_select_policy" ON team_roles;
DROP POLICY IF EXISTS "team_roles_insert_policy" ON team_roles;
DROP POLICY IF EXISTS "team_roles_update_policy" ON team_roles;
DROP POLICY IF EXISTS "team_roles_delete_policy" ON team_roles;
DROP POLICY IF EXISTS "Users can view team roles" ON team_roles;
DROP POLICY IF EXISTS "Users can insert team roles" ON team_roles;
DROP POLICY IF EXISTS "Users can update team roles" ON team_roles;
DROP POLICY IF EXISTS "Users can delete team roles" ON team_roles;

-- Remover políticas da tabela profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete profiles" ON profiles;

-- Remover políticas da tabela patients
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "patients_insert_policy" ON patients;
DROP POLICY IF EXISTS "patients_update_policy" ON patients;
DROP POLICY IF EXISTS "patients_delete_policy" ON patients;

-- Remover políticas da tabela diet_plans
DROP POLICY IF EXISTS "diet_plans_select_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_insert_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_update_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_delete_policy" ON diet_plans;

-- ============================================================================
-- PASSO 2: Criar funções auxiliares
-- ============================================================================

CREATE OR REPLACE FUNCTION is_team_member(owner_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND owner_id = owner_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_owner_id()
RETURNS UUID AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Primeiro verifica se o usuário é um owner
  SELECT id INTO v_owner_id
  FROM profiles
  WHERE id = auth.uid()
  AND role = 'nutritionist';
  
  -- Se encontrou, retorna
  IF v_owner_id IS NOT NULL THEN
    RETURN v_owner_id;
  END IF;
  
  -- Se não, verifica se é membro de equipe e retorna o owner_id
  SELECT owner_id INTO v_owner_id
  FROM team_members
  WHERE user_id = auth.uid()
  AND status = 'active'
  LIMIT 1;
  
  RETURN v_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASSO 3: TEAM_MEMBERS - Políticas RLS
-- ============================================================================

CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    user_id = auth.uid() OR
    owner_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    user_id = auth.uid()
  );

CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- PASSO 4: TEAM_ROLES - Políticas RLS
-- ============================================================================

CREATE POLICY "team_roles_select_policy" ON team_roles
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_team_member(owner_id)
  );

CREATE POLICY "team_roles_insert_policy" ON team_roles
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "team_roles_update_policy" ON team_roles
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "team_roles_delete_policy" ON team_roles
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- PASSO 5: PROFILES - Políticas RLS
-- ============================================================================

CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (SELECT user_id FROM team_members WHERE owner_id = auth.uid()) OR
    id IN (SELECT owner_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (id = auth.uid());

-- ============================================================================
-- PASSO 6: PATIENTS - Políticas RLS
-- ============================================================================

CREATE POLICY "patients_select_policy" ON patients
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

CREATE POLICY "patients_insert_policy" ON patients
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    user_id = get_user_owner_id()
  );

CREATE POLICY "patients_update_policy" ON patients
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

CREATE POLICY "patients_delete_policy" ON patients
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- ============================================================================
-- PASSO 7: DIET_PLANS - Políticas RLS
-- ============================================================================

CREATE POLICY "diet_plans_select_policy" ON diet_plans
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

CREATE POLICY "diet_plans_insert_policy" ON diet_plans
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    user_id = get_user_owner_id()
  );

CREATE POLICY "diet_plans_update_policy" ON diet_plans
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

CREATE POLICY "diet_plans_delete_policy" ON diet_plans
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- ============================================================================
-- PASSO 8: Garantir que RLS está habilitado
-- ============================================================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Após executar:
-- 1. Faça logout e login novamente
-- 2. Teste o acesso como membro da equipe
-- ============================================================================
