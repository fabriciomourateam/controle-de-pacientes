-- ============================================================================
-- BACKUP: Configuração RLS da tabela team_members (que deu certo)
-- ============================================================================
-- Use este script se no futuro precisar recriar as políticas de team_members
-- (ex.: após migração, restore, ou se alguma política for alterada por engano).
--
-- Pré-requisito: a função get_member_owner_id() deve existir
-- (criada por rls-isolamento-por-nutri.sql).
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (para recriar limpo)
DROP POLICY IF EXISTS "team_members_select_no_recursion" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_complete" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_simple" ON public.team_members;
DROP POLICY IF EXISTS "owners_and_members_can_view_team_members" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;

-- SELECT: owner vê sua equipe; membro vê próprio vínculo e colegas do mesmo owner
CREATE POLICY "team_members_select_no_recursion"
ON public.team_members FOR SELECT
USING (
  (owner_id = auth.uid())
  OR (user_id = auth.uid())
  OR (owner_id = get_member_owner_id())
);

-- INSERT: só o owner pode adicionar membros (com WITH CHECK owner_id = auth.uid())
CREATE POLICY "team_members_insert"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: só o owner pode editar membros da sua equipe
CREATE POLICY "team_members_update"
ON public.team_members FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE: só o owner pode remover membros da sua equipe
CREATE POLICY "team_members_delete"
ON public.team_members FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Fim do backup de políticas team_members.
