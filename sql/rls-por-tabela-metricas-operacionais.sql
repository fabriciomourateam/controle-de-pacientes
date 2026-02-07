-- ============================================================================
-- RLS POR TABELA – MÉTRICAS OPERACIONAIS (Tabela 24: dashboard_metricas)
-- ============================================================================
-- Requer: já ter rodado sql/rls-isolamento-por-nutri.sql (get_member_owner_id existe).
-- Antes: popular user_id nos dados existentes se houver linhas antigas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 24: dashboard_metricas
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_metricas' AND column_name = 'user_id') THEN
    ALTER TABLE public.dashboard_metricas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_dashboard_metricas_user_id ON public.dashboard_metricas(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em dashboard_metricas';
  END IF;
END $$;

ALTER TABLE public.dashboard_metricas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_metricas_all" ON public.dashboard_metricas;
DROP POLICY IF EXISTS "nutri_dashboard_metricas_select" ON public.dashboard_metricas;
DROP POLICY IF EXISTS "nutri_dashboard_metricas_insert" ON public.dashboard_metricas;
DROP POLICY IF EXISTS "nutri_dashboard_metricas_update" ON public.dashboard_metricas;
DROP POLICY IF EXISTS "nutri_dashboard_metricas_delete" ON public.dashboard_metricas;

CREATE POLICY "nutri_dashboard_metricas_select" ON public.dashboard_metricas FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));

CREATE POLICY "nutri_dashboard_metricas_insert" ON public.dashboard_metricas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_dashboard_metricas_update" ON public.dashboard_metricas FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));

CREATE POLICY "nutri_dashboard_metricas_delete" ON public.dashboard_metricas FOR DELETE TO authenticated
  USING (user_id = auth.uid());
