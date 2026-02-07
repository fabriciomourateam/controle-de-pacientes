-- ============================================================================
-- FIX 406 NO PORTAL: usar função SECURITY DEFINER para listar telefones com token
-- ============================================================================
-- O 406 acontece porque as políticas do portal usam:
--   telefone IN (SELECT telefone FROM patient_portal_tokens WHERE ...)
-- Com anon, essa subquery é avaliada com RLS; anon não lê patient_portal_tokens,
-- então a lista fica vazia e nenhum paciente é permitido.
--
-- Solução: função SECURITY DEFINER que retorna os telefones com token ativo.
-- Assim a checagem não depende de anon ler a tabela.
-- ============================================================================

-- 1) Criar função que retorna os telefones com token ativo (roda com permissão do dono)
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

-- 2) Recriar as políticas do portal USANDO a função (em vez da subquery direta)

-- patients
DROP POLICY IF EXISTS "portal_patients_select_by_phone" ON public.patients;
CREATE POLICY "portal_patients_select_by_phone" ON public.patients
FOR SELECT TO anon
USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));

-- checkin
DROP POLICY IF EXISTS "portal_checkin_select_by_phone" ON public.checkin;
CREATE POLICY "portal_checkin_select_by_phone" ON public.checkin
FOR SELECT TO anon
USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));

-- body_composition
DROP POLICY IF EXISTS "portal_body_composition_select_by_phone" ON public.body_composition;
CREATE POLICY "portal_body_composition_select_by_phone" ON public.body_composition
FOR SELECT TO anon
USING (telefone IN (SELECT get_phones_with_active_portal_tokens()));

-- diet_plans
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

-- diet_meals
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

-- diet_foods
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

-- diet_guidelines
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
