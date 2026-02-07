-- ============================================================================
-- RLS PORTAL – Desbloquear acesso do app dos alunos (um script só)
-- ============================================================================
-- Execute no SQL Editor do Supabase. Este script:
-- 1) Garante a função get_phones_with_active_portal_tokens() e permissão anon.
-- 2) Aplica políticas de SELECT para anon em todas as tabelas que o portal usa,
--    usando get_phones_with_active_portal_tokens() (só vê dados de quem tem link ativo).
-- 3) Não remove políticas de authenticated; só cria/atualiza as do portal.
--
-- Depois de rodar, o app dos alunos (anon) consegue ler pacientes, checkins,
-- composição corporal, dieta, exames, peso e comparação desde que o telefone
-- tenha um token ativo em patient_portal_tokens (link criado no painel do nutri).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Função e permissão
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_phones_with_active_portal_tokens()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT telefone FROM public.patient_portal_tokens
  WHERE is_active = true AND (expires_at IS NULL OR expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_phones_with_active_portal_tokens() TO anon;
GRANT EXECUTE ON FUNCTION public.get_phones_with_active_portal_tokens() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2) patients
-- ----------------------------------------------------------------------------
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_patients_select_by_phone" ON public.patients;
CREATE POLICY "portal_patients_select_by_phone" ON public.patients
FOR SELECT TO anon
USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));

-- ----------------------------------------------------------------------------
-- 3) checkin
-- ----------------------------------------------------------------------------
ALTER TABLE public.checkin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_checkin_select_by_phone" ON public.checkin;
CREATE POLICY "portal_checkin_select_by_phone" ON public.checkin
FOR SELECT TO anon
USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));

-- ----------------------------------------------------------------------------
-- 4) body_composition
-- ----------------------------------------------------------------------------
ALTER TABLE public.body_composition ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_body_composition_select_by_phone" ON public.body_composition;
CREATE POLICY "portal_body_composition_select_by_phone" ON public.body_composition
FOR SELECT TO anon
USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));

-- ----------------------------------------------------------------------------
-- 5) diet_plans
-- ----------------------------------------------------------------------------
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_diet_plans_select_released" ON public.diet_plans;
CREATE POLICY "portal_diet_plans_select_released" ON public.diet_plans
FOR SELECT TO anon
USING (
  (is_released = true OR is_released IS NULL)
  AND patient_id IN (
    SELECT id FROM public.patients
    WHERE telefone IN (SELECT get_phones_with_active_portal_tokens())
  )
);

-- ----------------------------------------------------------------------------
-- 6) diet_meals
-- ----------------------------------------------------------------------------
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_diet_meals_select" ON public.diet_meals;
CREATE POLICY "portal_diet_meals_select" ON public.diet_meals
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans dp
    JOIN public.patients p ON p.id = dp.patient_id
    WHERE dp.id = diet_meals.diet_plan_id
      AND (dp.is_released = true OR dp.is_released IS NULL)
      AND p.telefone IN (SELECT get_phones_with_active_portal_tokens())
  )
);

-- ----------------------------------------------------------------------------
-- 7) diet_foods
-- ----------------------------------------------------------------------------
ALTER TABLE public.diet_foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_diet_foods_select" ON public.diet_foods;
CREATE POLICY "portal_diet_foods_select" ON public.diet_foods
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_meals dm
    JOIN public.diet_plans dp ON dp.id = dm.diet_plan_id
    JOIN public.patients p ON p.id = dp.patient_id
    WHERE dm.id = diet_foods.meal_id
      AND (dp.is_released = true OR dp.is_released IS NULL)
      AND p.telefone IN (SELECT get_phones_with_active_portal_tokens())
  )
);

-- ----------------------------------------------------------------------------
-- 8) diet_guidelines
-- ----------------------------------------------------------------------------
ALTER TABLE public.diet_guidelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_diet_guidelines_select" ON public.diet_guidelines;
CREATE POLICY "portal_diet_guidelines_select" ON public.diet_guidelines
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans dp
    JOIN public.patients p ON p.id = dp.patient_id
    WHERE dp.id = diet_guidelines.diet_plan_id
      AND (dp.is_released = true OR dp.is_released IS NULL)
      AND p.telefone IN (SELECT get_phones_with_active_portal_tokens())
  )
);

-- ----------------------------------------------------------------------------
-- 9) laboratory_exams (se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'laboratory_exams') THEN
    ALTER TABLE public.laboratory_exams ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "portal_laboratory_exams_select_by_phone" ON public.laboratory_exams;
    CREATE POLICY "portal_laboratory_exams_select_by_phone" ON public.laboratory_exams
    FOR SELECT TO anon
    USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10) weight_tracking (se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weight_tracking') THEN
    ALTER TABLE public.weight_tracking ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "portal_weight_tracking_select_by_phone" ON public.weight_tracking;
    CREATE POLICY "portal_weight_tracking_select_by_phone" ON public.weight_tracking
    FOR SELECT TO anon
    USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 11) featured_photo_comparison (se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_photo_comparison') THEN
    ALTER TABLE public.featured_photo_comparison ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "portal_featured_photo_comparison_select_by_phone" ON public.featured_photo_comparison;
    CREATE POLICY "portal_featured_photo_comparison_select_by_phone" ON public.featured_photo_comparison
    FOR SELECT TO anon
    USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 12) food_database (portal pode precisar para nomes dos alimentos na dieta)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'food_database') THEN
    ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "portal_food_database_select" ON public.food_database;
    CREATE POLICY "portal_food_database_select" ON public.food_database
    FOR SELECT TO anon
    USING (true);
  END IF;
END $$;

-- Fim: políticas de portal aplicadas. App dos alunos (anon) deve conseguir acesso.
-- Lembrete: o telefone do paciente precisa ter token ativo em patient_portal_tokens.
