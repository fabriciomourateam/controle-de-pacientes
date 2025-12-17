-- Remover políticas duplicadas de team_members
-- Execute no Supabase SQL Editor

-- Remover versões _simple (duplicadas)
DROP POLICY IF EXISTS "team_members_select_simple" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_simple" ON team_members;
DROP POLICY IF EXISTS "team_members_update_simple" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_simple" ON team_members;

-- Remover versões normais também para recriar limpas
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- Recriar políticas limpas
CREATE POLICY "team_members_select"
ON team_members FOR SELECT
USING (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "team_members_insert"
ON team_members FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "team_members_update"
ON team_members FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "team_members_delete"
ON team_members FOR DELETE
USING (owner_id = auth.uid());

-- Verificar resultado
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'team_members';
