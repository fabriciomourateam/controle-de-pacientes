-- ============================================================================
-- SQL COMPLETO - TODAS AS TABELAS COM USER_ID
-- ============================================================================
-- Este script cria políticas RLS para TODAS as tabelas do sistema
-- O controle de acesso será feito via permissões do role do membro
-- ============================================================================

-- PASSO 1: Criar funções auxiliares
-- ============================================================================

CREATE OR REPLACE FUNCTION is_team_member(owner_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND owner_id = owner_user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_owner_id()
RETURNS UUID AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Primeiro verifica se o usuário é um owner
  SELECT id INTO v_owner_id
  FROM profiles
  WHERE id = auth.uid()
  AND role = 'nutritionist';
  
  IF v_owner_id IS NOT NULL THEN
    RETURN v_owner_id;
  END IF;
  
  -- Se não, verifica se é membro de equipe
  SELECT owner_id INTO v_owner_id
  FROM team_members
  WHERE user_id = auth.uid()
  AND is_active = true
  LIMIT 1;
  
  RETURN v_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 2: Remover políticas antigas
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Remove todas as políticas existentes de todas as tabelas
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- PASSO 3: Criar políticas para TEAM_MEMBERS e TEAM_ROLES
-- ============================================================================

-- TEAM_MEMBERS
CREATE POLICY "team_members_select" ON team_members FOR SELECT
  USING (owner_id = auth.uid() OR user_id = auth.uid() OR 
         owner_id IN (SELECT owner_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "team_members_insert" ON team_members FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "team_members_update" ON team_members FOR UPDATE
  USING (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "team_members_delete" ON team_members FOR DELETE
  USING (owner_id = auth.uid());

-- TEAM_ROLES
CREATE POLICY "team_roles_select" ON team_roles FOR SELECT
  USING (true); -- Todos podem ver roles (são templates)

CREATE POLICY "team_roles_insert" ON team_roles FOR INSERT
  WITH CHECK (true); -- Sistema pode criar roles

CREATE POLICY "team_roles_update" ON team_roles FOR UPDATE
  USING (true);

CREATE POLICY "team_roles_delete" ON team_roles FOR DELETE
  USING (true);

-- PASSO 4: Criar política genérica para TODAS as tabelas com user_id
-- ============================================================================

-- PROFILES
CREATE POLICY "profiles_all" ON profiles FOR ALL
  USING (id = auth.uid() OR 
         id IN (SELECT user_id FROM team_members WHERE owner_id = auth.uid()) OR
         id IN (SELECT owner_id FROM team_members WHERE user_id = auth.uid()));

-- PATIENTS
CREATE POLICY "patients_all" ON patients FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- DIET_PLANS
CREATE POLICY "diet_plans_all" ON diet_plans FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- DIET_MEALS
CREATE POLICY "diet_meals_all" ON diet_meals FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- CHECKIN
CREATE POLICY "checkin_all" ON checkin FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- BODY_COMPOSITION
CREATE POLICY "body_composition_all" ON body_composition FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- LABORATORY_EXAMS
CREATE POLICY "laboratory_exams_all" ON laboratory_exams FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- WEIGHT_TRACKING
CREATE POLICY "weight_tracking_all" ON weight_tracking FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- CONTACT_HISTORY
CREATE POLICY "contact_history_all" ON contact_history FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- PATIENT_PORTAL_TOKENS
CREATE POLICY "patient_portal_tokens_all" ON patient_portal_tokens FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- DIET_AI_GENERATIONS
CREATE POLICY "diet_ai_generations_all" ON diet_ai_generations FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- DIET_PLAN_TEMPLATES
CREATE POLICY "diet_plan_templates_all" ON diet_plan_templates FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- DIET_TEMPLATES
CREATE POLICY "diet_templates_all" ON diet_templates FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- FOOD_GROUPS
CREATE POLICY "food_groups_all" ON food_groups FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- FOOD_USAGE_STATS
CREATE POLICY "food_usage_stats_all" ON food_usage_stats FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- USER_FAVORITE_FOODS
CREATE POLICY "user_favorite_foods_all" ON user_favorite_foods FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- USER_FOOD_DATABASE
CREATE POLICY "user_food_database_all" ON user_food_database FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- USER_API_KEYS
CREATE POLICY "user_api_keys_all" ON user_api_keys FOR ALL
  USING (user_id = auth.uid());

-- USER_WEBHOOK_CONFIGS
CREATE POLICY "user_webhook_configs_all" ON user_webhook_configs FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- PLANS
CREATE POLICY "plans_all" ON plans FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- RETENTION_EXCLUSIONS
CREATE POLICY "retention_exclusions_all" ON retention_exclusions FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- SYNC_LOGS
CREATE POLICY "sync_logs_all" ON sync_logs FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- DASHBOARD E MÉTRICAS (todas as tabelas de dashboard)
CREATE POLICY "dashboard_dados_all" ON dashboard_dados FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

CREATE POLICY "alertas_dashboard_all" ON alertas_dashboard FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

CREATE POLICY "total_vendas_all" ON "Total de Vendas" FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

CREATE POLICY "total_leads_all" ON "Total de Leads" FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

CREATE POLICY "total_calls_all" ON "Total de Calls Agendadas" FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

CREATE POLICY "total_agend_funil_all" ON "Total de Agendamentos por Funil" FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

CREATE POLICY "total_leads_funil_all" ON "Total de Leads por Funil" FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

CREATE POLICY "leads_entraram_all" ON leads_que_entraram FOR ALL
  USING (user_id = auth.uid() OR is_team_member(user_id));

-- PASSO 5: Habilitar RLS em todas as tabelas
-- ============================================================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_composition ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_food_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_dados ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Total de Vendas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Total de Leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Total de Calls Agendadas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Total de Agendamentos por Funil" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Total de Leads por Funil" ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_que_entraram ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
