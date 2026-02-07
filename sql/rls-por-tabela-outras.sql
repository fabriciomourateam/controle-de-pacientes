-- ============================================================================
-- RLS POR TABELA – OUTRAS TABELAS (Tabelas 25 a 33)
-- ============================================================================
-- Execute UM BLOCO POR VEZ (comente o resto se quiser).
-- Requer: já ter rodado sql/rls-isolamento-por-nutri.sql (get_member_owner_id existe).
-- Antes de habilitar RLS em cada tabela: popular user_id nos dados existentes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 25: leads_que_entraram
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads_que_entraram') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads_que_entraram' AND column_name = 'user_id') THEN
      ALTER TABLE public.leads_que_entraram ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_leads_que_entraram_user_id ON public.leads_que_entraram(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em leads_que_entraram';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads_que_entraram') THEN
    ALTER TABLE public.leads_que_entraram ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "leads_entraram_all" ON public.leads_que_entraram;
    DROP POLICY IF EXISTS "nutri_leads_entraram_select" ON public.leads_que_entraram;
    DROP POLICY IF EXISTS "nutri_leads_entraram_insert" ON public.leads_que_entraram;
    DROP POLICY IF EXISTS "nutri_leads_entraram_update" ON public.leads_que_entraram;
    DROP POLICY IF EXISTS "nutri_leads_entraram_delete" ON public.leads_que_entraram;

    CREATE POLICY "nutri_leads_entraram_select" ON public.leads_que_entraram FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_leads_entraram_insert" ON public.leads_que_entraram FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_leads_entraram_update" ON public.leads_que_entraram FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_leads_entraram_delete" ON public.leads_que_entraram FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em leads_que_entraram';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 26: custom_foods (só se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_foods') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'custom_foods' AND column_name = 'user_id') THEN
      ALTER TABLE public.custom_foods ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id ON public.custom_foods(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em custom_foods';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_foods') THEN
    ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "custom_foods_all" ON public.custom_foods;
    DROP POLICY IF EXISTS "nutri_custom_foods_select" ON public.custom_foods;
    DROP POLICY IF EXISTS "nutri_custom_foods_insert" ON public.custom_foods;
    DROP POLICY IF EXISTS "nutri_custom_foods_update" ON public.custom_foods;
    DROP POLICY IF EXISTS "nutri_custom_foods_delete" ON public.custom_foods;

    CREATE POLICY "nutri_custom_foods_select" ON public.custom_foods FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_custom_foods_insert" ON public.custom_foods FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_custom_foods_update" ON public.custom_foods FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_custom_foods_delete" ON public.custom_foods FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em custom_foods';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 28: user_favorite_meals (só se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_meals') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_favorite_meals' AND column_name = 'user_id') THEN
      ALTER TABLE public.user_favorite_meals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_user_favorite_meals_user_id ON public.user_favorite_meals(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em user_favorite_meals';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_meals') THEN
    ALTER TABLE public.user_favorite_meals ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "user_favorite_meals_all" ON public.user_favorite_meals;
    DROP POLICY IF EXISTS "nutri_user_favorite_meals_select" ON public.user_favorite_meals;
    DROP POLICY IF EXISTS "nutri_user_favorite_meals_insert" ON public.user_favorite_meals;
    DROP POLICY IF EXISTS "nutri_user_favorite_meals_update" ON public.user_favorite_meals;
    DROP POLICY IF EXISTS "nutri_user_favorite_meals_delete" ON public.user_favorite_meals;

    CREATE POLICY "nutri_user_favorite_meals_select" ON public.user_favorite_meals FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_user_favorite_meals_insert" ON public.user_favorite_meals FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_user_favorite_meals_update" ON public.user_favorite_meals FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_user_favorite_meals_delete" ON public.user_favorite_meals FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em user_favorite_meals';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 29: user_favorite_foods (só se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_foods') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_favorite_foods' AND column_name = 'user_id') THEN
      ALTER TABLE public.user_favorite_foods ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_user_id ON public.user_favorite_foods(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em user_favorite_foods';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_foods') THEN
    ALTER TABLE public.user_favorite_foods ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "user_favorite_foods_all" ON public.user_favorite_foods;
    DROP POLICY IF EXISTS "nutri_user_favorite_foods_select" ON public.user_favorite_foods;
    DROP POLICY IF EXISTS "nutri_user_favorite_foods_insert" ON public.user_favorite_foods;
    DROP POLICY IF EXISTS "nutri_user_favorite_foods_update" ON public.user_favorite_foods;
    DROP POLICY IF EXISTS "nutri_user_favorite_foods_delete" ON public.user_favorite_foods;

    CREATE POLICY "nutri_user_favorite_foods_select" ON public.user_favorite_foods FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_user_favorite_foods_insert" ON public.user_favorite_foods FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_user_favorite_foods_update" ON public.user_favorite_foods FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_user_favorite_foods_delete" ON public.user_favorite_foods FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em user_favorite_foods';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 30: checkin_feedback_analysis (só se a tabela existir; acesso por patient)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkin_feedback_analysis') THEN
    ALTER TABLE public.checkin_feedback_analysis ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "checkin_feedback_analysis_all" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_select" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_insert" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_update" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_delete" ON public.checkin_feedback_analysis;

    -- Acesso via patient do nutri (checkin_feedback_analysis costuma ter patient_id ou checkin_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checkin_feedback_analysis' AND column_name = 'user_id') THEN
      CREATE POLICY "nutri_checkin_feedback_select" ON public.checkin_feedback_analysis FOR SELECT TO authenticated
        USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
      CREATE POLICY "nutri_checkin_feedback_insert" ON public.checkin_feedback_analysis FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
      CREATE POLICY "nutri_checkin_feedback_update" ON public.checkin_feedback_analysis FOR UPDATE TO authenticated
        USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
      CREATE POLICY "nutri_checkin_feedback_delete" ON public.checkin_feedback_analysis FOR DELETE TO authenticated
        USING (user_id = auth.uid());
    ELSE
      -- Sem user_id: acesso via patient_id
      CREATE POLICY "nutri_checkin_feedback_select" ON public.checkin_feedback_analysis FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.checkin c
            WHERE c.id = checkin_feedback_analysis.checkin_id
              AND (c.user_id = auth.uid() OR c.user_id = get_member_owner_id())
          )
        );
      CREATE POLICY "nutri_checkin_feedback_insert" ON public.checkin_feedback_analysis FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.checkin c
            WHERE c.id = checkin_feedback_analysis.checkin_id
              AND (c.user_id = auth.uid() OR c.user_id = get_member_owner_id())
          )
        );
      CREATE POLICY "nutri_checkin_feedback_update" ON public.checkin_feedback_analysis FOR UPDATE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.checkin c
            WHERE c.id = checkin_feedback_analysis.checkin_id
              AND (c.user_id = auth.uid() OR c.user_id = get_member_owner_id())
          )
        );
      CREATE POLICY "nutri_checkin_feedback_delete" ON public.checkin_feedback_analysis FOR DELETE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.checkin c
            WHERE c.id = checkin_feedback_analysis.checkin_id
              AND c.user_id = auth.uid()
          )
        );
    END IF;
    RAISE NOTICE 'RLS aplicado em checkin_feedback_analysis';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 31: ai_insights_custom (só se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights_custom') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights_custom' AND column_name = 'user_id') THEN
      ALTER TABLE public.ai_insights_custom ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_ai_insights_custom_user_id ON public.ai_insights_custom(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em ai_insights_custom';
    END IF;
    ALTER TABLE public.ai_insights_custom ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "ai_insights_custom_all" ON public.ai_insights_custom;
    DROP POLICY IF EXISTS "nutri_ai_insights_custom_select" ON public.ai_insights_custom;
    DROP POLICY IF EXISTS "nutri_ai_insights_custom_insert" ON public.ai_insights_custom;
    DROP POLICY IF EXISTS "nutri_ai_insights_custom_update" ON public.ai_insights_custom;
    DROP POLICY IF EXISTS "nutri_ai_insights_custom_delete" ON public.ai_insights_custom;
    CREATE POLICY "nutri_ai_insights_custom_select" ON public.ai_insights_custom FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_ai_insights_custom_insert" ON public.ai_insights_custom FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_ai_insights_custom_update" ON public.ai_insights_custom FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_ai_insights_custom_delete" ON public.ai_insights_custom FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em ai_insights_custom';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 31b: ai_insights_hidden (só se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights_hidden') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights_hidden' AND column_name = 'user_id') THEN
      ALTER TABLE public.ai_insights_hidden ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_ai_insights_hidden_user_id ON public.ai_insights_hidden(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em ai_insights_hidden';
    END IF;
    ALTER TABLE public.ai_insights_hidden ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "ai_insights_hidden_all" ON public.ai_insights_hidden;
    DROP POLICY IF EXISTS "nutri_ai_insights_hidden_select" ON public.ai_insights_hidden;
    DROP POLICY IF EXISTS "nutri_ai_insights_hidden_insert" ON public.ai_insights_hidden;
    DROP POLICY IF EXISTS "nutri_ai_insights_hidden_update" ON public.ai_insights_hidden;
    DROP POLICY IF EXISTS "nutri_ai_insights_hidden_delete" ON public.ai_insights_hidden;
    CREATE POLICY "nutri_ai_insights_hidden_select" ON public.ai_insights_hidden FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_ai_insights_hidden_insert" ON public.ai_insights_hidden FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_ai_insights_hidden_update" ON public.ai_insights_hidden FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_ai_insights_hidden_delete" ON public.ai_insights_hidden FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em ai_insights_hidden';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 32: photo_visibility_settings (só se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'photo_visibility_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'photo_visibility_settings' AND column_name = 'user_id') THEN
      ALTER TABLE public.photo_visibility_settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_photo_visibility_settings_user_id ON public.photo_visibility_settings(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em photo_visibility_settings';
    END IF;
    ALTER TABLE public.photo_visibility_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "photo_visibility_settings_all" ON public.photo_visibility_settings;
    DROP POLICY IF EXISTS "nutri_photo_visibility_select" ON public.photo_visibility_settings;
    DROP POLICY IF EXISTS "nutri_photo_visibility_insert" ON public.photo_visibility_settings;
    DROP POLICY IF EXISTS "nutri_photo_visibility_update" ON public.photo_visibility_settings;
    DROP POLICY IF EXISTS "nutri_photo_visibility_delete" ON public.photo_visibility_settings;
    CREATE POLICY "nutri_photo_visibility_select" ON public.photo_visibility_settings FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_photo_visibility_insert" ON public.photo_visibility_settings FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_photo_visibility_update" ON public.photo_visibility_settings FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_photo_visibility_delete" ON public.photo_visibility_settings FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em photo_visibility_settings';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABELA 33: featured_photo_comparison (só se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_photo_comparison') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'featured_photo_comparison' AND column_name = 'user_id') THEN
      ALTER TABLE public.featured_photo_comparison ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_featured_photo_comparison_user_id ON public.featured_photo_comparison(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em featured_photo_comparison';
    END IF;
    ALTER TABLE public.featured_photo_comparison ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "featured_photo_comparison_all" ON public.featured_photo_comparison;
    DROP POLICY IF EXISTS "nutri_featured_photo_select" ON public.featured_photo_comparison;
    DROP POLICY IF EXISTS "nutri_featured_photo_insert" ON public.featured_photo_comparison;
    DROP POLICY IF EXISTS "nutri_featured_photo_update" ON public.featured_photo_comparison;
    DROP POLICY IF EXISTS "nutri_featured_photo_delete" ON public.featured_photo_comparison;
    CREATE POLICY "nutri_featured_photo_select" ON public.featured_photo_comparison FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_featured_photo_insert" ON public.featured_photo_comparison FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_featured_photo_update" ON public.featured_photo_comparison FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_featured_photo_delete" ON public.featured_photo_comparison FOR DELETE TO authenticated
      USING (user_id = auth.uid());
    RAISE NOTICE 'RLS aplicado em featured_photo_comparison';
  END IF;
END $$;
