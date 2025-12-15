-- ============================================================================
-- CORRIGIR RECURSÃO INFINITA - TEAM_MEMBERS
-- ============================================================================
-- O problema é que a política de team_members está consultando team_members
-- causando recursão infinita
-- ============================================================================

-- PASSO 1: Remover TODAS as políticas de team_members
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_all" ON team_members;

-- PASSO 2: Criar políticas SIMPLES sem recursão
-- SELECT: Owner vê seus membros, membro vê a si mesmo
CREATE POLICY "team_members_select_simple" ON team_members
  FOR SELECT
  USING (
    owner_id = auth.uid() OR  -- Owner vê seus membros
    user_id = auth.uid()      -- Membro vê a si mesmo
  );

-- INSERT: Apenas owner pode adicionar membros
CREATE POLICY "team_members_insert_simple" ON team_members
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Owner pode atualizar seus membros, membro pode atualizar a si mesmo
CREATE POLICY "team_members_update_simple" ON team_members
  FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    user_id = auth.uid()
  );

-- DELETE: Apenas owner pode remover membros
CREATE POLICY "team_members_delete_simple" ON team_members
  FOR DELETE
  USING (owner_id = auth.uid());

-- PASSO 3: Garantir que RLS está habilitado
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM - Agora team_members não tem mais recursão
-- ============================================================================
