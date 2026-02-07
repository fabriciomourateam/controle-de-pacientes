-- ============================================================================
-- RLS: MANTER ACESSO DO PORTAL DO PACIENTE (app na Vercel)
-- ============================================================================
-- Execute DEPOIS do script rls-isolamento-por-nutri.sql (Passo 0.3).
--
-- O portal acessa: patients (por telefone), checkin (por telefone),
-- body_composition (por telefone), diet_plans/diet_meals/diet_foods (por patient_id).
-- O portal usa a chave ANON do Supabase (não há usuário logado).
--
-- Opção 1: Políticas por telefone (anon só lê onde telefone está em tokens ativos)
--   - Permite que anon leia patients/checkin/body_composition onde o telefone
--     tem um token ativo. Qualquer pessoa que saiba um telefone com token
--     poderia tentar acessar; o token na URL é validado no app antes de mostrar dados.
--   - Segurança: o app só mostra dados depois de validar o token na URL;
--     as queries ao Supabase ainda precisam passar para carregar dados.
--
-- Opção 2 (recomendada): Função única que o portal chama com o token.
--   - get_portal_patient_data(token text): valida token, retorna paciente + checkins
--     + body_composition + dietas em um JSON. O app chama essa RPC em vez de
--     vários .from(). Assim anon não precisa de SELECT em patients/checkin/body.
--
-- Este arquivo implementa OPÇÃO 2 (função) + políticas anon mínimas para
-- patient_portal_tokens (só leitura por token) e para as tabelas de dados
-- quando a sessão tiver o telefone definido (via função que seta app.portal_phone).
-- Na prática, a forma mais simples e segura é: uma função RPC que retorna tudo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Função: validar token e retornar telefone (para uso em políticas ou app)
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
  IF portal_token IS NULL OR portal_token = '' THEN
    RETURN NULL;
  END IF;
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
-- 2) Função principal do portal: retorna todos os dados do paciente por token
--    O app na Vercel pode chamar: supabase.rpc('get_portal_patient_data', { portal_token: token })
--    e usar o JSON retornado em vez de várias chamadas a .from('patients'), etc.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_portal_patient_data(portal_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_telefone text;
  v_patient json;
  v_checkins json;
  v_body_composition json;
  v_diet_plans json;
  result json;
BEGIN
  v_telefone := public.get_phone_from_portal_token(portal_token);
  IF v_telefone IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'token_invalid');
  END IF;

  SELECT to_jsonb(p.*) INTO v_patient
  FROM public.patients p
  WHERE p.telefone = v_telefone
  LIMIT 1;

  SELECT COALESCE(jsonb_agg(c ORDER BY c.data_checkin DESC), '[]'::jsonb) INTO v_checkins
  FROM public.checkin c
  WHERE c.telefone = v_telefone;

  SELECT COALESCE(jsonb_agg(b ORDER BY b.data_avaliacao DESC NULLS LAST), '[]'::jsonb) INTO v_body_composition
  FROM public.body_composition b
  WHERE b.telefone = v_telefone;

  SELECT COALESCE(
    (SELECT jsonb_agg(pl ORDER BY pl.created_at DESC)
     FROM (
       SELECT dp.*,
         (SELECT jsonb_agg(dm ORDER BY dm.ordem, dm.id)
          FROM (SELECT dm.*,
                 (SELECT jsonb_agg(df ORDER BY df.ordem, df.id)
                  FROM diet_foods df WHERE df.meal_id = dm.id) AS foods
                FROM diet_meals dm WHERE dm.diet_plan_id = dp.id) dm) AS meals,
         (SELECT jsonb_agg(dg ORDER BY dg.ordem)
          FROM diet_guidelines dg WHERE dg.diet_plan_id = dp.id) AS guidelines
       FROM diet_plans dp
       WHERE dp.patient_id = (SELECT id FROM public.patients WHERE telefone = v_telefone LIMIT 1)
         AND (dp.is_released = true OR dp.is_released IS NULL)
     ) pl
    ),
    '[]'::jsonb
  ) INTO v_diet_plans;

  result := json_build_object(
    'ok', true,
    'patient', v_patient,
    'checkins', v_checkins,
    'body_composition', v_body_composition,
    'diet_plans', v_diet_plans
  );
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_portal_patient_data(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_portal_patient_data(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3) Políticas anon para o portal (se o app continuar usando .from() por telefone)
--    Só adicione estas políticas se NÃO for usar a função get_portal_patient_data
--    e quiser que anon leia diretamente por telefone (menos seguro).
--    Para usar a função, NÃO execute o bloco abaixo.
-- ----------------------------------------------------------------------------
-- Permissão anon em patient_portal_tokens: só para validar token (ler telefone por token).
-- Como não dá para passar o token na policy, anon precisa de uma forma de ler.
-- A função get_phone_from_portal_token já permite validar sem expor a tabela.
-- Se o app só usar get_portal_patient_data(portal_token), não precisa de policy anon em patients/checkin/body.

-- Opcional: permitir anon ler patient_portal_tokens apenas a linha do token (seguro só via função).
-- Deixamos anon sem SELECT em patient_portal_tokens; a função SECURITY DEFINER faz o trabalho.

-- ----------------------------------------------------------------------------
-- 4) Políticas explícitas para PORTAL (anon) – leitura por telefone
--    Use isto apenas se o app NÃO for migrado para get_portal_patient_data.
--    Permite anon SELECT em patients/checkin/body_composition onde o telefone
--    existe em patient_portal_tokens ativo. Isso ainda expõe qualquer paciente
--    que tenha token a quem descobrir o telefone; o token na URL é a proteção no app.
-- ----------------------------------------------------------------------------
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patients' AND policyname = 'portal_patients_select_by_phone') THEN
    CREATE POLICY "portal_patients_select_by_phone" ON public.patients
    FOR SELECT TO anon
    USING (
      telefone IN (
        SELECT telefone FROM public.patient_portal_tokens
        WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
      )
    );
    RAISE NOTICE 'Policy portal_patients_select_by_phone criada.';
  END IF;
END $policy$;

-- checkin: anon pode ler apenas onde telefone tem token ativo
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'checkin' AND policyname = 'portal_checkin_select_by_phone') THEN
    CREATE POLICY "portal_checkin_select_by_phone" ON public.checkin
    FOR SELECT TO anon
    USING (
      telefone IN (
        SELECT telefone FROM public.patient_portal_tokens
        WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
      )
    );
    RAISE NOTICE 'Policy portal_checkin_select_by_phone criada.';
  END IF;
END $policy$;

-- body_composition: anon pode ler apenas onde telefone tem token ativo
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'body_composition' AND policyname = 'portal_body_composition_select_by_phone') THEN
    CREATE POLICY "portal_body_composition_select_by_phone" ON public.body_composition
    FOR SELECT TO anon
    USING (
      telefone IN (
        SELECT telefone FROM public.patient_portal_tokens
        WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
      )
    );
    RAISE NOTICE 'Policy portal_body_composition_select_by_phone criada.';
  END IF;
END $policy$;

-- diet_plans: anon lê planos liberados do paciente com token ativo
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diet_plans' AND policyname = 'portal_diet_plans_select_released') THEN
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
    RAISE NOTICE 'Policy portal_diet_plans_select_released criada.';
  END IF;
END $policy$;

-- diet_meals: anon lê apenas de planos já autorizados para portal
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diet_meals' AND policyname = 'portal_diet_meals_select') THEN
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
    RAISE NOTICE 'Policy portal_diet_meals_select criada.';
  END IF;
END $policy$;

-- diet_foods: anon lê apenas de refeições de planos do portal
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diet_foods' AND policyname = 'portal_diet_foods_select') THEN
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
    RAISE NOTICE 'Policy portal_diet_foods_select criada.';
  END IF;
END $policy$;

-- diet_guidelines: anon lê apenas de planos do portal
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
    RAISE NOTICE 'Policy portal_diet_guidelines_select criada.';
  END IF;
END $policy$;

-- food_database: portal pode precisar ler para mostrar nomes dos alimentos nas dietas
DO $policy$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'food_database') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'food_database' AND policyname = 'portal_food_database_select') THEN
      CREATE POLICY "portal_food_database_select" ON public.food_database FOR SELECT TO anon USING (true);
      RAISE NOTICE 'Policy portal_food_database_select criada (leitura pública para nomes).';
    END IF;
  END IF;
END $policy$;
