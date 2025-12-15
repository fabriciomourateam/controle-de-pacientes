-- ============================================================================
-- SQL COMPLETO PARA CORRIGIR ACESSO DE MEMBROS DA EQUIPE
-- ============================================================================
-- Este script corrige TODOS os problemas de RLS para membros da equipe
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================================================

-- PASSO 1: Remover TODAS as políticas RLS existentes que podem estar causando conflito
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

-- Remover políticas das tabelas de dados
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "patients_insert_policy" ON patients;
DROP POLICY IF EXISTS "patients_update_policy" ON patients;
DROP POLICY IF EXISTS "patients_delete_policy" ON patients;

DROP POLICY IF EXISTS "diet_plans_select_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_insert_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_update_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_delete_policy" ON diet_plans;

-- Exams policies removidas (tabela não existe)

-- Patient_photos policies removidas (tabela não existe)

DROP POLICY IF EXISTS "daily_weights_select_policy" ON daily_weights;
DROP POLICY IF EXISTS "daily_weights_insert_policy" ON daily_weights;
DROP POLICY IF EXISTS "daily_weights_update_policy" ON daily_weights;
DROP POLICY IF EXISTS "daily_weights_delete_policy" ON daily_weights;

-- ============================================================================
-- PASSO 2: Criar função auxiliar para verificar se usuário é membro da equipe
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

-- ============================================================================
-- PASSO 3: Criar função auxiliar para obter o owner_id do usuário atual
-- ============================================================================

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
-- PASSO 4: TEAM_MEMBERS - Políticas RLS (SEM RESTRIÇÕES)
-- ============================================================================

-- SELECT: Owner vê seus membros, membros veem a si mesmos e outros membros do mesmo owner
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT
  USING (
    owner_id = auth.uid() OR  -- Owner vê seus membros
    user_id = auth.uid() OR   -- Membro vê a si mesmo
    owner_id IN (             -- Membro vê outros membros do mesmo owner
      SELECT owner_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Apenas owner pode adicionar membros
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Owner pode atualizar seus membros, membro pode atualizar a si mesmo
CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    user_id = auth.uid()
  );

-- DELETE: Apenas owner pode remover membros
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- PASSO 5: TEAM_ROLES - Políticas RLS
-- ============================================================================

-- SELECT: Owner vê seus roles, membros veem roles do seu owner
CREATE POLICY "team_roles_select_policy" ON team_roles
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_team_member(owner_id)
  );

-- INSERT: Apenas owner pode criar roles
CREATE POLICY "team_roles_insert_policy" ON team_roles
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owner pode atualizar roles
CREATE POLICY "team_roles_update_policy" ON team_roles
  FOR UPDATE
  USING (owner_id = auth.uid());

-- DELETE: Apenas owner pode deletar roles
CREATE POLICY "team_roles_delete_policy" ON team_roles
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- PASSO 6: PROFILES - Políticas RLS
-- ============================================================================

-- SELECT: Usuário vê seu próprio perfil, owner vê perfis de seus membros
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (SELECT user_id FROM team_members WHERE owner_id = auth.uid()) OR
    id IN (SELECT owner_id FROM team_members WHERE user_id = auth.uid())
  );

-- INSERT: Usuário pode criar seu próprio perfil
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: Usuário pode atualizar seu próprio perfil
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- DELETE: Usuário pode deletar seu próprio perfil
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (id = auth.uid());

-- ============================================================================
-- PASSO 7: PATIENTS - Políticas RLS
-- ============================================================================

-- SELECT: Owner vê seus pacientes, membros veem pacientes do owner
CREATE POLICY "patients_select_policy" ON patients
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- INSERT: Owner e membros podem adicionar pacientes
CREATE POLICY "patients_insert_policy" ON patients
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    user_id = get_user_owner_id()
  );

-- UPDATE: Owner e membros podem atualizar pacientes
CREATE POLICY "patients_update_policy" ON patients
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- DELETE: Owner e membros podem deletar pacientes
CREATE POLICY "patients_delete_policy" ON patients
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- ============================================================================
-- PASSO 8: DIET_PLANS - Políticas RLS
-- ============================================================================

-- SELECT: Owner vê suas dietas, membros veem dietas do owner
CREATE POLICY "diet_plans_select_policy" ON diet_plans
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- INSERT: Owner e membros podem criar dietas
CREATE POLICY "diet_plans_insert_policy" ON diet_plans
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    user_id = get_user_owner_id()
  );

-- UPDATE: Owner e membros podem atualizar dietas
CREATE POLICY "diet_plans_update_policy" ON diet_plans
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- DELETE: Owner e membros podem deletar dietas
CREATE POLICY "diet_plans_delete_policy" ON diet_plans
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- ============================================================================
-- PASSO 9: EXAMS - Políticas RLS (TABELA NÃO EXISTE - PULADO)
-- ============================================================================
-- A tabela exams não existe no banco de dados, pulando...

-- ============================================================================
-- PASSO 10: PATIENT_PHOTOS - Políticas RLS (TABELA NÃO EXISTE - PULADO)
-- ============================================================================
-- A tabela patient_photos não existe no banco de dados, pulando...

-- ============================================================================
-- PASSO 11: DAILY_WEIGHTS - Políticas RLS
-- ============================================================================

-- SELECT: Owner vê seus pesos, membros veem pesos do owner
CREATE POLICY "daily_weights_select_policy" ON daily_weights
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- INSERT: Owner e membros podem adicionar pesos
CREATE POLICY "daily_weights_insert_policy" ON daily_weights
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    user_id = get_user_owner_id()
  );

-- UPDATE: Owner e membros podem atualizar pesos
CREATE POLICY "daily_weights_update_policy" ON daily_weights
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- DELETE: Owner e membros podem deletar pesos
CREATE POLICY "daily_weights_delete_policy" ON daily_weights
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    is_team_member(user_id)
  );

-- ============================================================================
-- PASSO 12: Garantir que RLS está habilitado em todas as tabelas
-- ============================================================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exams ENABLE ROW LEVEL SECURITY; -- Tabela não existe
-- ALTER TABLE patient_photos ENABLE ROW LEVEL SECURITY; -- Tabela não existe
ALTER TABLE daily_weights ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Após executar este script:
-- 1. Faça logout e login novamente no sistema
-- 2. Teste o acesso como membro da equipe
-- 3. Verifique se consegue ver os dados do owner
-- ============================================================================
