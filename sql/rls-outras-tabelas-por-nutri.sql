-- ============================================================================
-- RLS OUTRAS TABELAS: Tabelas 26 a 33 (custom_foods, favoritos, insights, fotos)
-- ============================================================================
-- Execute no SQL Editor do Supabase. Requer: já ter rodado rls-isolamento-por-nutri.sql
-- (função get_member_owner_id existe).
--
-- Este script:
-- 1) Adiciona user_id nas tabelas (se não existir). Se já existir, pula.
-- 2) Preenche user_id onde estiver NULL com o UUID do owner (troque abaixo se for outro nutri).
-- 3) Habilita RLS e cria políticas: cada nutri vê só os próprios dados; equipe vê do owner.
--
-- Se as colunas user_id já existem, apenas o preenchimento de NULLs e as políticas RLS serão aplicados.
-- UUID abaixo: fabriciomouratreinador@gmail.com (troque no DO $$ se os dados forem de outro dono)
-- ============================================================================

DO $$
DECLARE
  owner_uuid uuid := 'a9798432-60bd-4ac8-a035-d139a47ad59b';
BEGIN
  -- --------------------------------------------------------------------------
  -- TABELA 26: custom_foods
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_foods' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'custom_foods' AND column_name = 'user_id') THEN
      ALTER TABLE public.custom_foods ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id ON public.custom_foods(user_id);
    END IF;
    UPDATE public.custom_foods SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 27: food_database (se tiver user_id; pode ser global)
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'food_database' AND table_type = 'BASE TABLE') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'food_database' AND column_name = 'user_id') THEN
      UPDATE public.food_database SET user_id = owner_uuid WHERE user_id IS NULL;
    END IF;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 28: user_favorite_meals
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_meals' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_favorite_meals' AND column_name = 'user_id') THEN
      ALTER TABLE public.user_favorite_meals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_user_favorite_meals_user_id ON public.user_favorite_meals(user_id);
    END IF;
    UPDATE public.user_favorite_meals SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 29: user_favorite_foods
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_foods' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_favorite_foods' AND column_name = 'user_id') THEN
      ALTER TABLE public.user_favorite_foods ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_user_id ON public.user_favorite_foods(user_id);
    END IF;
    UPDATE public.user_favorite_foods SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 30: checkin_feedback_analysis (só UPDATE se tiver coluna user_id)
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkin_feedback_analysis' AND table_type = 'BASE TABLE') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checkin_feedback_analysis' AND column_name = 'user_id') THEN
      UPDATE public.checkin_feedback_analysis SET user_id = owner_uuid WHERE user_id IS NULL;
    END IF;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 31: ai_insights_custom
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights_custom' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights_custom' AND column_name = 'user_id') THEN
      ALTER TABLE public.ai_insights_custom ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_ai_insights_custom_user_id ON public.ai_insights_custom(user_id);
    END IF;
    UPDATE public.ai_insights_custom SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 31b: ai_insights_hidden
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights_hidden' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights_hidden' AND column_name = 'user_id') THEN
      ALTER TABLE public.ai_insights_hidden ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_ai_insights_hidden_user_id ON public.ai_insights_hidden(user_id);
    END IF;
    UPDATE public.ai_insights_hidden SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 32: photo_visibility_settings
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'photo_visibility_settings' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'photo_visibility_settings' AND column_name = 'user_id') THEN
      ALTER TABLE public.photo_visibility_settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_photo_visibility_settings_user_id ON public.photo_visibility_settings(user_id);
    END IF;
    UPDATE public.photo_visibility_settings SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 33: featured_photo_comparison
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_photo_comparison' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'featured_photo_comparison' AND column_name = 'user_id') THEN
      ALTER TABLE public.featured_photo_comparison ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_featured_photo_comparison_user_id ON public.featured_photo_comparison(user_id);
    END IF;
    UPDATE public.featured_photo_comparison SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  RAISE NOTICE 'user_id conferido/preenchido nas tabelas 26-33 (RLS em seguida).';
END $$;

-- ============================================================================
-- PARTE 2: Habilitar RLS e criar políticas
-- ============================================================================

-- custom_foods (remove políticas antigas users_can_* se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_foods' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "users_can_select_own_custom_foods" ON public.custom_foods;
    DROP POLICY IF EXISTS "users_can_insert_own_custom_foods" ON public.custom_foods;
    DROP POLICY IF EXISTS "users_can_update_own_custom_foods" ON public.custom_foods;
    DROP POLICY IF EXISTS "users_can_delete_own_custom_foods" ON public.custom_foods;
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
    CREATE POLICY "nutri_custom_foods_delete" ON public.custom_foods FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- food_database (SELECT: próprio + equipe + linhas globais user_id IS NULL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'food_database' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "food_database_all" ON public.food_database;
    DROP POLICY IF EXISTS "nutri_food_database_select" ON public.food_database;
    DROP POLICY IF EXISTS "nutri_food_database_insert" ON public.food_database;
    DROP POLICY IF EXISTS "nutri_food_database_update" ON public.food_database;
    DROP POLICY IF EXISTS "nutri_food_database_delete" ON public.food_database;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'food_database' AND column_name = 'user_id') THEN
      CREATE POLICY "nutri_food_database_select" ON public.food_database FOR SELECT TO authenticated
        USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()) OR user_id IS NULL);
      CREATE POLICY "nutri_food_database_insert" ON public.food_database FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
      CREATE POLICY "nutri_food_database_update" ON public.food_database FOR UPDATE TO authenticated
        USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
      CREATE POLICY "nutri_food_database_delete" ON public.food_database FOR DELETE TO authenticated USING (user_id = auth.uid());
    ELSE
      CREATE POLICY "nutri_food_database_select" ON public.food_database FOR SELECT TO authenticated USING (true);
      CREATE POLICY "nutri_food_database_insert" ON public.food_database FOR INSERT TO authenticated WITH CHECK (true);
      CREATE POLICY "nutri_food_database_update" ON public.food_database FOR UPDATE TO authenticated USING (true);
      CREATE POLICY "nutri_food_database_delete" ON public.food_database FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

-- user_favorite_meals
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_meals' AND table_type = 'BASE TABLE') THEN
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
    CREATE POLICY "nutri_user_favorite_meals_delete" ON public.user_favorite_meals FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- user_favorite_foods
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorite_foods' AND table_type = 'BASE TABLE') THEN
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
    CREATE POLICY "nutri_user_favorite_foods_delete" ON public.user_favorite_foods FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- checkin_feedback_analysis (com user_id ou via checkin → patient)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkin_feedback_analysis' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE public.checkin_feedback_analysis ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "checkin_feedback_analysis_all" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_select" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_insert" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_update" ON public.checkin_feedback_analysis;
    DROP POLICY IF EXISTS "nutri_checkin_feedback_delete" ON public.checkin_feedback_analysis;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checkin_feedback_analysis' AND column_name = 'user_id') THEN
      CREATE POLICY "nutri_checkin_feedback_select" ON public.checkin_feedback_analysis FOR SELECT TO authenticated
        USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
      CREATE POLICY "nutri_checkin_feedback_insert" ON public.checkin_feedback_analysis FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
      CREATE POLICY "nutri_checkin_feedback_update" ON public.checkin_feedback_analysis FOR UPDATE TO authenticated
        USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
      CREATE POLICY "nutri_checkin_feedback_delete" ON public.checkin_feedback_analysis FOR DELETE TO authenticated USING (user_id = auth.uid());
    ELSE
      CREATE POLICY "nutri_checkin_feedback_select" ON public.checkin_feedback_analysis FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM public.checkin c WHERE c.id = checkin_feedback_analysis.checkin_id AND (c.user_id = auth.uid() OR c.user_id = get_member_owner_id())));
      CREATE POLICY "nutri_checkin_feedback_insert" ON public.checkin_feedback_analysis FOR INSERT TO authenticated
        WITH CHECK (EXISTS (SELECT 1 FROM public.checkin c WHERE c.id = checkin_feedback_analysis.checkin_id AND (c.user_id = auth.uid() OR c.user_id = get_member_owner_id())));
      CREATE POLICY "nutri_checkin_feedback_update" ON public.checkin_feedback_analysis FOR UPDATE TO authenticated
        USING (EXISTS (SELECT 1 FROM public.checkin c WHERE c.id = checkin_feedback_analysis.checkin_id AND (c.user_id = auth.uid() OR c.user_id = get_member_owner_id())));
      CREATE POLICY "nutri_checkin_feedback_delete" ON public.checkin_feedback_analysis FOR DELETE TO authenticated
        USING (EXISTS (SELECT 1 FROM public.checkin c WHERE c.id = checkin_feedback_analysis.checkin_id AND c.user_id = auth.uid()));
    END IF;
  END IF;
END $$;

-- ai_insights_custom
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights_custom' AND table_type = 'BASE TABLE') THEN
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
    CREATE POLICY "nutri_ai_insights_custom_delete" ON public.ai_insights_custom FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ai_insights_hidden
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights_hidden' AND table_type = 'BASE TABLE') THEN
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
    CREATE POLICY "nutri_ai_insights_hidden_delete" ON public.ai_insights_hidden FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- photo_visibility_settings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'photo_visibility_settings' AND table_type = 'BASE TABLE') THEN
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
    CREATE POLICY "nutri_photo_visibility_delete" ON public.photo_visibility_settings FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- featured_photo_comparison
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_photo_comparison' AND table_type = 'BASE TABLE') THEN
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
    CREATE POLICY "nutri_featured_photo_delete" ON public.featured_photo_comparison FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Fim: tabelas 26-33 com RLS por nutri (owner + equipe).
