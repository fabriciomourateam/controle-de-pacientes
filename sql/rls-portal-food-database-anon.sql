-- ============================================================================
-- RLS: Permitir anon (portal/app dos alunos) ler food_database
-- ============================================================================
-- O app dos alunos pode precisar exibir nomes dos alimentos ao mostrar a dieta.
-- A tabela food_database hoje só tem políticas para authenticated e service_role;
-- anon não consegue SELECT.
--
-- Este script APENAS ADICIONA uma política de SELECT para anon.
-- Não remove nem altera nenhuma política existente (nutri continua como está).
-- ============================================================================

ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_food_database_select" ON public.food_database;
CREATE POLICY "portal_food_database_select" ON public.food_database
FOR SELECT TO anon
USING (is_active = true);

-- Fim. Agora anon pode ler alimentos ativos (para exibir na dieta no portal).
