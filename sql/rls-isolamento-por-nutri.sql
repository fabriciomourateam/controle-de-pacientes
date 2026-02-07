-- ============================================================================
-- RLS: ISOLAMENTO POR NUTRICIONISTA
-- ============================================================================
-- Cada nutri vê apenas seus próprios dados (pacientes, checkins, dietas,
-- retenção, etc.). Membros de equipe veem os dados do owner que os convidou.
--
-- PORTAL (APP DE ALUNOS): Este script NÃO remove políticas cujo nome contenha
-- "portal" ou "Allow read ... for portal" / "Allow ... for portal". Elas são
-- mantidas para o app de alunos continuar lendo dados (por telefone/token).
-- Só são removidas as políticas listadas explicitamente abaixo.
--
-- IMPORTANTE: Antes de rodar, popule user_id nos dados existentes (veja
-- INSTRUCOES_RLS_NUTRI.md). Depois execute este script no SQL Editor do Supabase.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADICIONAR user_id ONDE NÃO EXISTIR
-- ----------------------------------------------------------------------------

-- patients
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'user_id') THEN
    ALTER TABLE public.patients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em patients';
  END IF;
END $$;

-- checkin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checkin' AND column_name = 'user_id') THEN
    ALTER TABLE public.checkin ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_checkin_user_id ON public.checkin(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em checkin';
  END IF;
END $$;

-- patient_feedback_records (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_feedback_records') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'patient_feedback_records' AND column_name = 'user_id') THEN
      ALTER TABLE public.patient_feedback_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_patient_feedback_records_user_id ON public.patient_feedback_records(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em patient_feedback_records';
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. FUNÇÃO AUXILIAR: OWNER ID PARA MEMBROS DE EQUIPE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_member_owner_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN
    RETURN NULL;
  END IF;
  SELECT owner_id INTO result
  FROM public.team_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_owner_id() TO authenticated;

-- Condição reutilizável: "é meu dado ou sou membro do owner"
-- (owner: user_id = auth.uid(); membro: user_id = get_member_owner_id())

-- ----------------------------------------------------------------------------
-- 3. PATIENTS – RLS ESTRITO (sem fallback user_id IS NULL)
-- ----------------------------------------------------------------------------

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_and_team_can_view_patients" ON public.patients;
DROP POLICY IF EXISTS "owners_and_team_can_view_patients_v2" ON public.patients;
DROP POLICY IF EXISTS "patients_select_policy" ON public.patients;
DROP POLICY IF EXISTS "Users can only see their own patients" ON public.patients;
DROP POLICY IF EXISTS "Enable read access for all" ON public.patients;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.patients;
DROP POLICY IF EXISTS "only_owners_can_insert_patients" ON public.patients;
DROP POLICY IF EXISTS "owners_and_team_can_update_patients" ON public.patients;
DROP POLICY IF EXISTS "only_owners_can_delete_patients" ON public.patients;
DROP POLICY IF EXISTS "Allow delete for owners and team members" ON public.patients;

CREATE POLICY "nutri_select_patients"
  ON public.patients FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  );

CREATE POLICY "nutri_insert_patients"
  ON public.patients FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_update_patients"
  ON public.patients FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  );

CREATE POLICY "nutri_delete_patients"
  ON public.patients FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. CHECKIN – RLS ESTRITO
-- ----------------------------------------------------------------------------

ALTER TABLE public.checkin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_and_team_can_view_checkins" ON public.checkin;
DROP POLICY IF EXISTS "owners_and_team_can_insert_checkins" ON public.checkin;
DROP POLICY IF EXISTS "owners_and_team_can_update_checkins" ON public.checkin;
DROP POLICY IF EXISTS "only_owners_can_delete_checkins" ON public.checkin;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.checkin;
DROP POLICY IF EXISTS "Enable read access for all" ON public.checkin;
DROP POLICY IF EXISTS "nutricionista_checkin_access" ON public.checkin;

CREATE POLICY "nutri_select_checkin"
  ON public.checkin FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  );

CREATE POLICY "nutri_insert_checkin"
  ON public.checkin FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_update_checkin"
  ON public.checkin FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
  );

CREATE POLICY "nutri_delete_checkin"
  ON public.checkin FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. DIET_PLANS – por user_id / created_by
-- ----------------------------------------------------------------------------

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_plans_select_policy" ON public.diet_plans;
DROP POLICY IF EXISTS "diet_plans_insert_policy" ON public.diet_plans;
DROP POLICY IF EXISTS "diet_plans_update_policy" ON public.diet_plans;
DROP POLICY IF EXISTS "diet_plans_delete_policy" ON public.diet_plans;
DROP POLICY IF EXISTS "diet_plans_all" ON public.diet_plans;

CREATE POLICY "nutri_select_diet_plans"
  ON public.diet_plans FOR SELECT TO authenticated
  USING (
    (user_id IS NOT NULL AND (user_id = auth.uid() OR user_id = get_member_owner_id()))
    OR (created_by IS NOT NULL AND (created_by = auth.uid() OR created_by = get_member_owner_id()))
    OR (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid() OR user_id = get_member_owner_id()))
  );

CREATE POLICY "nutri_insert_diet_plans"
  ON public.diet_plans FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() OR user_id = get_member_owner_id())
    OR (created_by = auth.uid() OR created_by = get_member_owner_id())
  );

CREATE POLICY "nutri_update_diet_plans"
  ON public.diet_plans FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() OR user_id = get_member_owner_id())
    OR (created_by = auth.uid() OR created_by = get_member_owner_id())
  );

CREATE POLICY "nutri_delete_diet_plans"
  ON public.diet_plans FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR created_by = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- 6. DIET_MEALS – via diet_plans
-- ----------------------------------------------------------------------------

ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_meals_all" ON public.diet_meals;
DROP POLICY IF EXISTS "nutri_diet_meals" ON public.diet_meals;

CREATE POLICY "nutri_diet_meals"
  ON public.diet_meals FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_meals.diet_plan_id
        AND (
          (dp.user_id = auth.uid() OR dp.user_id = get_member_owner_id())
          OR (dp.created_by = auth.uid() OR dp.created_by = get_member_owner_id())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_meals.diet_plan_id
        AND (
          (dp.user_id = auth.uid() OR dp.user_id = get_member_owner_id())
          OR (dp.created_by = auth.uid() OR dp.created_by = get_member_owner_id())
        )
    )
  );

-- ----------------------------------------------------------------------------
-- 7. DIET_FOODS – via diet_meals -> diet_plans
-- ----------------------------------------------------------------------------

ALTER TABLE public.diet_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_foods_all" ON public.diet_foods;
DROP POLICY IF EXISTS "nutri_diet_foods" ON public.diet_foods;

CREATE POLICY "nutri_diet_foods"
  ON public.diet_foods FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.diet_meals dm
      JOIN public.diet_plans dp ON dp.id = dm.diet_plan_id
      WHERE dm.id = diet_foods.meal_id
        AND (
          (dp.user_id = auth.uid() OR dp.user_id = get_member_owner_id())
          OR (dp.created_by = auth.uid() OR dp.created_by = get_member_owner_id())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diet_meals dm
      JOIN public.diet_plans dp ON dp.id = dm.diet_plan_id
      WHERE dm.id = diet_foods.meal_id
        AND (
          (dp.user_id = auth.uid() OR dp.user_id = get_member_owner_id())
          OR (dp.created_by = auth.uid() OR dp.created_by = get_member_owner_id())
        )
    )
  );

-- ----------------------------------------------------------------------------
-- 8. DIET_GUIDELINES – via diet_plans
-- ----------------------------------------------------------------------------

ALTER TABLE public.diet_guidelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_guidelines_all" ON public.diet_guidelines;
DROP POLICY IF EXISTS "nutri_diet_guidelines" ON public.diet_guidelines;

CREATE POLICY "nutri_diet_guidelines"
  ON public.diet_guidelines FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_guidelines.diet_plan_id
        AND (
          (dp.user_id = auth.uid() OR dp.user_id = get_member_owner_id())
          OR (dp.created_by = auth.uid() OR dp.created_by = get_member_owner_id())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_guidelines.diet_plan_id
        AND (
          (dp.user_id = auth.uid() OR dp.user_id = get_member_owner_id())
          OR (dp.created_by = auth.uid() OR dp.created_by = get_member_owner_id())
        )
    )
  );

-- ----------------------------------------------------------------------------
-- 9. RETENTION_EXCLUSIONS – tem user_id
-- ----------------------------------------------------------------------------

ALTER TABLE public.retention_exclusions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutri_retention_select" ON public.retention_exclusions;
DROP POLICY IF EXISTS "nutri_retention_insert" ON public.retention_exclusions;
DROP POLICY IF EXISTS "nutri_retention_update" ON public.retention_exclusions;
DROP POLICY IF EXISTS "nutri_retention_delete" ON public.retention_exclusions;

CREATE POLICY "nutri_retention_select"
  ON public.retention_exclusions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_retention_insert"
  ON public.retention_exclusions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_retention_update"
  ON public.retention_exclusions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_retention_delete"
  ON public.retention_exclusions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 10. PLANS (planos de assinatura) – tem user_id (NULL = plano público)
-- ----------------------------------------------------------------------------

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutri_plans_select" ON public.plans;
DROP POLICY IF EXISTS "nutri_plans_all" ON public.plans;
DROP POLICY IF EXISTS "nutri_plans_insert" ON public.plans;
DROP POLICY IF EXISTS "nutri_plans_update" ON public.plans;
DROP POLICY IF EXISTS "nutri_plans_delete" ON public.plans;
DROP POLICY IF EXISTS "plans_all" ON public.plans;

CREATE POLICY "nutri_plans_select"
  ON public.plans FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = get_member_owner_id()
    OR user_id IS NULL
  );

CREATE POLICY "nutri_plans_insert"
  ON public.plans FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_plans_update"
  ON public.plans FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());

CREATE POLICY "nutri_plans_delete"
  ON public.plans FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 11. USER_PREFERENCES – cada usuário só vê a própria linha
-- (coluna user_id é TEXT no schema; comparar com auth.uid()::text)
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_full_access" ON public.user_preferences;

CREATE POLICY "nutri_preferences_select"
  ON public.user_preferences FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "nutri_preferences_insert"
  ON public.user_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "nutri_preferences_update"
  ON public.user_preferences FOR UPDATE TO authenticated
  USING (user_id = (auth.uid())::text);

-- ----------------------------------------------------------------------------
-- 12. DIET_AI_GENERATIONS – tem user_id
-- ----------------------------------------------------------------------------

ALTER TABLE public.diet_ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutri_diet_ai_select" ON public.diet_ai_generations;

CREATE POLICY "nutri_diet_ai_all"
  ON public.diet_ai_generations FOR ALL TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id())
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());

-- ----------------------------------------------------------------------------
-- 13. PATIENT_FEEDBACK_RECORDS – por user_id ou por patient
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_feedback_records') THEN
    ALTER TABLE public.patient_feedback_records ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "nutri_feedback_select" ON public.patient_feedback_records;
    DROP POLICY IF EXISTS "nutri_feedback_insert" ON public.patient_feedback_records;
    DROP POLICY IF EXISTS "nutri_feedback_update" ON public.patient_feedback_records;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'patient_feedback_records' AND column_name = 'user_id') THEN
      CREATE POLICY "nutri_feedback_select" ON public.patient_feedback_records FOR SELECT TO authenticated
        USING (user_id = auth.uid() OR user_id = get_member_owner_id());
      CREATE POLICY "nutri_feedback_insert" ON public.patient_feedback_records FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
      CREATE POLICY "nutri_feedback_update" ON public.patient_feedback_records FOR UPDATE TO authenticated
        USING (user_id = auth.uid() OR user_id = get_member_owner_id());
    ELSE
      CREATE POLICY "nutri_feedback_select" ON public.patient_feedback_records FOR SELECT TO authenticated
        USING (
          patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid() OR user_id = get_member_owner_id())
        );
      CREATE POLICY "nutri_feedback_insert" ON public.patient_feedback_records FOR INSERT TO authenticated
        WITH CHECK (
          patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid() OR user_id = get_member_owner_id())
        );
      CREATE POLICY "nutri_feedback_update" ON public.patient_feedback_records FOR UPDATE TO authenticated
        USING (
          patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid() OR user_id = get_member_owner_id())
        );
    END IF;
    RAISE NOTICE 'RLS aplicado em patient_feedback_records';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 14. BODY_COMPOSITION, WEIGHT_TRACKING, CONTACT_HISTORY, DASHBOARD_DADOS,
--     ALERTAS_DASHBOARD, LABORATORY_EXAMS – owner + equipe (não remove portal_*)
-- ----------------------------------------------------------------------------

-- body_composition (tem user_id)
ALTER TABLE public.body_composition ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "body_composition_all" ON public.body_composition;
DROP POLICY IF EXISTS "owners_and_team_can_view_body_composition" ON public.body_composition;
CREATE POLICY "nutri_body_composition_select" ON public.body_composition FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_body_composition_insert" ON public.body_composition FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_body_composition_update" ON public.body_composition FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_body_composition_delete" ON public.body_composition FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- weight_tracking (tem user_id)
ALTER TABLE public.weight_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weight_tracking_all" ON public.weight_tracking;
CREATE POLICY "nutri_weight_tracking_select" ON public.weight_tracking FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_weight_tracking_insert" ON public.weight_tracking FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_weight_tracking_update" ON public.weight_tracking FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_weight_tracking_delete" ON public.weight_tracking FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- contact_history (tem user_id)
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contact_history_all" ON public.contact_history;
DROP POLICY IF EXISTS "contact_history_select" ON public.contact_history;
DROP POLICY IF EXISTS "contact_history_insert" ON public.contact_history;
DROP POLICY IF EXISTS "contact_history_update" ON public.contact_history;
DROP POLICY IF EXISTS "contact_history_delete" ON public.contact_history;
CREATE POLICY "nutri_contact_history_select" ON public.contact_history FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_contact_history_insert" ON public.contact_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_contact_history_update" ON public.contact_history FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_contact_history_delete" ON public.contact_history FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- dashboard_dados (tem user_id)
ALTER TABLE public.dashboard_dados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dashboard_dados_all" ON public.dashboard_dados;
CREATE POLICY "nutri_dashboard_dados_select" ON public.dashboard_dados FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_dashboard_dados_insert" ON public.dashboard_dados FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_dashboard_dados_update" ON public.dashboard_dados FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_dashboard_dados_delete" ON public.dashboard_dados FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- alertas_dashboard (tem user_id)
ALTER TABLE public.alertas_dashboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alertas_dashboard_all" ON public.alertas_dashboard;
CREATE POLICY "nutri_alertas_select" ON public.alertas_dashboard FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_alertas_insert" ON public.alertas_dashboard FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_alertas_update" ON public.alertas_dashboard FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_alertas_delete" ON public.alertas_dashboard FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- laboratory_exams (tem user_id)
ALTER TABLE public.laboratory_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "laboratory_exams_all" ON public.laboratory_exams;
CREATE POLICY "nutri_lab_exams_select" ON public.laboratory_exams FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_lab_exams_insert" ON public.laboratory_exams FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_lab_exams_update" ON public.laboratory_exams FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id = get_member_owner_id());
CREATE POLICY "nutri_lab_exams_delete" ON public.laboratory_exams FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 15. TRIGGER: preencher user_id em INSERT (patients e checkin)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_id_on_patients_insert ON public.patients;
CREATE TRIGGER set_user_id_on_patients_insert
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_user_id_on_checkin_insert ON public.checkin;
CREATE TRIGGER set_user_id_on_checkin_insert
  BEFORE INSERT ON public.checkin
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- ----------------------------------------------------------------------------
-- FIM
-- ----------------------------------------------------------------------------

SELECT 'RLS de isolamento por nutricionista aplicado.' AS status;
