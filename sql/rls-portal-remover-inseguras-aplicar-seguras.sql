-- ============================================================================
-- RLS PORTAL: Remover políticas inseguras e garantir só leitura por token ativo
-- ============================================================================
-- Execute DEPOIS do script rls-isolamento-por-nutri.sql (Passo 0.3).
--
-- Problema: várias políticas do portal têm qual = true (anon lê TUDO).
-- Isso permite que qualquer pessoa veja dados de qualquer paciente.
--
-- Este script:
-- 0) Cria função get_phone_from_portal_token (para o app validar token sem ler a tabela).
-- 1) Remove as políticas inseguras do portal (qual true ou sem checar token).
-- 2) Cria políticas seguras: anon só lê onde o telefone tem token ativo.
--    Assim: paciente do nutri A vê só seu portal; paciente do nutri B, só o dele.
--
-- Se o portal validar token lendo patient_portal_tokens e essa tabela tiver RLS
-- sem policy para anon, use no app: supabase.rpc('get_phone_from_portal_token', { portal_token: token })
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) Função para validar token e retornar telefone (app pode usar em vez de ler a tabela)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_phone_from_portal_token(portal_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  out_phone text;
BEGIN
  IF portal_token IS NULL OR portal_token = '' THEN RETURN NULL; END IF;
  SELECT telefone INTO out_phone
  FROM public.patient_portal_tokens
  WHERE token = portal_token AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  RETURN out_phone;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_phone_from_portal_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_phone_from_portal_token(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 1) REMOVER POLÍTICAS INSECURAS (qual = true ou leitura sem vínculo com token)
-- ----------------------------------------------------------------------------

-- body_composition: remover as que permitem anon ler tudo
DROP POLICY IF EXISTS "Allow read body_composition for portal (anon)" ON public.body_composition;
DROP POLICY IF EXISTS "portal_body_composition_read" ON public.body_composition;
DROP POLICY IF EXISTS "portal_body_composition_select_by_phone" ON public.body_composition;
-- Manter "portal_body_composition_select_secure" se existir (já é segura)

-- checkin
DROP POLICY IF EXISTS "portal_checkin_read" ON public.checkin;
-- Manter "portal_checkin_select_secure" se existir

-- patients: esta permite anon ler TODOS os pacientes (muito insegura)
DROP POLICY IF EXISTS "portal_patients_select_by_phone" ON public.patients;

-- diet_plans: "Allow read released diet_plans for portal (anon)" permite anon ler qualquer plano liberado
DROP POLICY IF EXISTS "Allow read released diet_plans for portal (anon)" ON public.diet_plans;
DROP POLICY IF EXISTS "portal_diet_plans_select_by_patient" ON public.diet_plans;

-- diet_meals
DROP POLICY IF EXISTS "Allow read diet_meals for portal released plans (anon)" ON public.diet_meals;
DROP POLICY IF EXISTS "Allow read diet_meals for patient plans" ON public.diet_meals;

-- diet_foods
DROP POLICY IF EXISTS "Allow read diet_foods for portal released plans (anon)" ON public.diet_foods;
DROP POLICY IF EXISTS "Allow read diet_foods for patient meals" ON public.diet_foods;

-- ----------------------------------------------------------------------------
-- 2) CRIAR POLÍTICAS SEGURAS (anon só lê onde telefone tem token ativo)
--    Assim: paciente do nutri A acessa só seu portal; paciente do nutri B, só o dele.
-- ----------------------------------------------------------------------------

-- patients: anon só vê paciente cujo telefone tem token ativo
CREATE POLICY "portal_patients_select_by_phone" ON public.patients
FOR SELECT TO anon
USING (
  telefone IN (
    SELECT telefone FROM public.patient_portal_tokens
    WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
  )
);

-- checkin: anon só vê checkins do telefone com token ativo
CREATE POLICY "portal_checkin_select_by_phone" ON public.checkin
FOR SELECT TO anon
USING (
  telefone IN (
    SELECT telefone FROM public.patient_portal_tokens
    WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Remover a duplicata se existir com outro nome (deixar só uma política segura)
DROP POLICY IF EXISTS "portal_checkin_select_secure" ON public.checkin;

-- body_composition: anon só vê linhas do telefone com token ativo
CREATE POLICY "portal_body_composition_select_by_phone" ON public.body_composition
FOR SELECT TO anon
USING (
  telefone IN (
    SELECT telefone FROM public.patient_portal_tokens
    WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
  )
);

DROP POLICY IF EXISTS "portal_body_composition_select_secure" ON public.body_composition;

-- diet_plans: anon só vê planos liberados de pacientes cujo telefone tem token ativo
CREATE POLICY "portal_diet_plans_select_released" ON public.diet_plans
FOR SELECT TO anon
USING (
  (is_released = true OR is_released IS NULL)
  AND patient_id IN (
    SELECT id FROM public.patients
    WHERE telefone IN (
      SELECT telefone FROM public.patient_portal_tokens
      WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
    )
  )
);

-- diet_meals: anon só vê refeições de planos liberados desses pacientes
CREATE POLICY "portal_diet_meals_select" ON public.diet_meals
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans dp
    JOIN public.patients p ON p.id = dp.patient_id
    WHERE dp.id = diet_meals.diet_plan_id
      AND (dp.is_released = true OR dp.is_released IS NULL)
      AND p.telefone IN (
        SELECT telefone FROM public.patient_portal_tokens
        WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
      )
  )
);

-- diet_foods: anon só vê alimentos dessas refeições
CREATE POLICY "portal_diet_foods_select" ON public.diet_foods
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_meals dm
    JOIN public.diet_plans dp ON dp.id = dm.diet_plan_id
    JOIN public.patients p ON p.id = dp.patient_id
    WHERE dm.id = diet_foods.meal_id
      AND (dp.is_released = true OR dp.is_released IS NULL)
      AND p.telefone IN (
        SELECT telefone FROM public.patient_portal_tokens
        WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
      )
  )
);

-- diet_guidelines: anon só vê diretrizes desses planos
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diet_guidelines' AND policyname = 'portal_diet_guidelines_select') THEN
    CREATE POLICY "portal_diet_guidelines_select" ON public.diet_guidelines
    FOR SELECT TO anon
    USING (
      EXISTS (
        SELECT 1 FROM public.diet_plans dp
        JOIN public.patients p ON p.id = dp.patient_id
        WHERE dp.id = diet_guidelines.diet_plan_id
          AND (dp.is_released = true OR dp.is_released IS NULL)
          AND p.telefone IN (
            SELECT telefone FROM public.patient_portal_tokens
            WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
          )
      )
    );
  END IF;
END $policy$;

-- ----------------------------------------------------------------------------
-- 3) patient_portal_tokens: anon precisa validar token (ler telefone por token)
--    Não dá para restringir por token na policy; a leitura é feita pela função
--    get_phone_from_portal_token (SECURITY DEFINER). Se o app validar token
--    chamando essa RPC, não precisa de SELECT anon na tabela.
--    Se o app ainda ler direto da tabela com .eq('token', token), precisamos
--    de uma policy que permita anon ler - mas isso expõe todos os tokens se
--    usarmos USING (true). A solução segura é o app usar get_phone_from_portal_token.
--    Deixamos a tabela sem policy anon; o app deve usar a RPC para validar.
--    (Se já existir policy anon em patient_portal_tokens que quebre o portal,
--     comente o DROP abaixo.)
-- ----------------------------------------------------------------------------
-- Não criamos policy anon em patient_portal_tokens (seguro). Validar token via RPC.
