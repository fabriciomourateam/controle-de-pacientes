-- ============================================
-- CORRIGIR POLÍTICAS RLS DE TEAM_MEMBERS
-- ============================================
-- Membros precisam ver seu próprio registro em team_members
-- para que as políticas de patients/checkin funcionem

-- Remover políticas antigas
DROP POLICY IF EXISTS "Owners podem ver seus membros" ON team_members;
DROP POLICY IF EXISTS "Owners podem inserir membros" ON team_members;
DROP POLICY IF EXISTS "Owners podem atualizar seus membros" ON team_members;
DROP POLICY IF EXISTS "Owners podem deletar seus membros" ON team_members;
DROP POLICY IF EXISTS "Membros podem ver suas informações" ON team_members;

-- SELECT: Owner vê seus membros OU membro vê seu próprio registro
CREATE POLICY "owners_and_members_can_view_team_members"
ON team_members FOR SELECT
USING (
  owner_id = auth.uid()  -- Owner vê seus membros
  OR
  user_id = auth.uid()   -- Membro vê seu próprio registro
);

-- INSERT: Apenas owner
CREATE POLICY "only_owners_can_insert_team_members"
ON team_members FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owner
CREATE POLICY "only_owners_can_update_team_members"
ON team_members FOR UPDATE
USING (owner_id = auth.uid());

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_team_members"
ON team_members FOR DELETE
USING (owner_id = auth.uid());

-- Verificar políticas criadas
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY policyname;

-- Testar acesso (execute como membro)
SELECT 
  'Teste de acesso' as status,
  COUNT(*) as meus_registros
FROM team_members
WHERE user_id = auth.uid();
