-- Corrigir RLS da tabela team_members para permitir owner ver seus membros
-- Execute no Supabase SQL Editor

-- 1. Remover TODAS as policies existentes
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can manage team members" ON team_members;
DROP POLICY IF EXISTS "Owner can view team members" ON team_members;
DROP POLICY IF EXISTS "Owner can manage team members" ON team_members;

-- 2. Criar policies corretas

-- SELECT: Owner pode ver seus membros, membro pode ver a si mesmo
CREATE POLICY "team_members_select" ON team_members
FOR SELECT USING (
  owner_id = auth.uid() OR user_id = auth.uid()
);

-- INSERT: Apenas owner pode adicionar membros
CREATE POLICY "team_members_insert" ON team_members
FOR INSERT WITH CHECK (
  owner_id = auth.uid()
);

-- UPDATE: Owner pode atualizar seus membros
CREATE POLICY "team_members_update" ON team_members
FOR UPDATE USING (
  owner_id = auth.uid()
);

-- DELETE: Owner pode remover seus membros
CREATE POLICY "team_members_delete" ON team_members
FOR DELETE USING (
  owner_id = auth.uid()
);

-- 3. Garantir que RLS está habilitado
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 4. Testar - deve retornar seus membros agora
SELECT * FROM team_members WHERE owner_id = auth.uid();
