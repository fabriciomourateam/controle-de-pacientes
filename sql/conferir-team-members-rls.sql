-- ============================================================================
-- CONFERIR RLS EM team_members
-- ============================================================================
-- Execute no SQL Editor do Supabase para ver o estado atual.
-- Não altera nada; só mostra se RLS está ativo e quais políticas existem.
-- ============================================================================

-- 1. RLS está habilitado?
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'team_members';

-- 2. Quais políticas existem?
SELECT
  policyname,
  cmd AS comando,
  qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'team_members'
ORDER BY policyname;

-- O que deve ter (em resumo):
-- SELECT: owner vê linhas onde owner_id = auth.uid(); membro vê a própria linha (user_id = auth.uid()) e, se quiser, as do mesmo owner (owner_id = get_member_owner_id()).
-- INSERT/UPDATE/DELETE: só o owner (owner_id = auth.uid()) pode criar/editar/remover membros da sua equipe.
-- Se get_member_owner_id() já existir (criada pelo rls-isolamento-por-nutri.sql), ela usa team_members com SECURITY DEFINER, então continua funcionando mesmo que o membro não tenha SELECT direto na tabela. O app, porém, precisa que owner e membro consigam SELECT nas linhas corretas para listar equipe / ver próprio vínculo.
