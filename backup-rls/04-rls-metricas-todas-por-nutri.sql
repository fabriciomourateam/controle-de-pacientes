-- ============================================================================
-- RLS MÉTRICAS: separar todas as métricas por nutri (comerciais + operacionais)
-- ============================================================================
-- Execute no SQL Editor do Supabase. Requer: já ter rodado rls-isolamento-por-nutri.sql
-- (função get_member_owner_id existe).
--
-- Este script:
-- 1) Adiciona user_id nas tabelas de métricas (se não existir). Se já existir, pula.
-- 2) Atribui os dados EXISTENTES ao seu user_id onde user_id IS NULL (troque o UUID abaixo se for outro nutri).
-- 3) Habilita RLS e cria políticas: cada nutri vê só as próprias métricas; equipe vê do owner.
--
-- Se as colunas user_id já existem em todas as tabelas, apenas o preenchimento de NULLs e as políticas RLS serão aplicados.
-- UUID abaixo: fabriciomouratreinador@gmail.com (troque no DO $$ se os dados forem de outro dono)
-- ============================================================================

DO $$
DECLARE
  owner_uuid uuid := 'a9798432-60bd-4ac8-a035-d139a47ad59b';
BEGIN
  -- --------------------------------------------------------------------------
  -- TABELA 18: Total de Leads
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Leads') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Leads' AND column_name = 'user_id') THEN
      ALTER TABLE "Total de Leads" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_total_de_leads_user_id ON "Total de Leads"(user_id);
    END IF;
    UPDATE "Total de Leads" SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 19: Total de Calls Agendadas
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Calls Agendadas') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Calls Agendadas' AND column_name = 'user_id') THEN
      ALTER TABLE "Total de Calls Agendadas" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_total_de_calls_user_id ON "Total de Calls Agendadas"(user_id);
    END IF;
    UPDATE "Total de Calls Agendadas" SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 20: Total de Leads por Funil
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Leads por Funil') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Leads por Funil' AND column_name = 'user_id') THEN
      ALTER TABLE "Total de Leads por Funil" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_total_leads_funil_user_id ON "Total de Leads por Funil"(user_id);
    END IF;
    UPDATE "Total de Leads por Funil" SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 21: Total de Agendamentos por Funil
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Agendamentos por Funil') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Agendamentos por Funil' AND column_name = 'user_id') THEN
      ALTER TABLE "Total de Agendamentos por Funil" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_total_agend_funil_user_id ON "Total de Agendamentos por Funil"(user_id);
    END IF;
    UPDATE "Total de Agendamentos por Funil" SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 22: Total de Vendas
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Vendas') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Vendas' AND column_name = 'user_id') THEN
      ALTER TABLE "Total de Vendas" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_total_de_vendas_user_id ON "Total de Vendas"(user_id);
    END IF;
    UPDATE "Total de Vendas" SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 23: Total de Vendas 2026
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Vendas 2026') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Vendas 2026' AND column_name = 'user_id') THEN
      ALTER TABLE "Total de Vendas 2026" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_total_vendas_2026_user_id ON "Total de Vendas 2026"(user_id);
    END IF;
    UPDATE "Total de Vendas 2026" SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 24: dashboard_metricas (pula se for VIEW; no seu projeto é view)
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dashboard_metricas' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_metricas' AND column_name = 'user_id') THEN
      ALTER TABLE public.dashboard_metricas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_dashboard_metricas_user_id ON public.dashboard_metricas(user_id);
    END IF;
    UPDATE public.dashboard_metricas SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- TABELA 25: leads_que_entraram
  -- --------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads_que_entraram') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads_que_entraram' AND column_name = 'user_id') THEN
      ALTER TABLE public.leads_que_entraram ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_leads_que_entraram_user_id ON public.leads_que_entraram(user_id);
    END IF;
    UPDATE public.leads_que_entraram SET user_id = owner_uuid WHERE user_id IS NULL;
  END IF;

  RAISE NOTICE 'user_id conferido/preenchido nas tabelas de métricas (RLS em seguida).';
END $$;

-- ============================================================================
-- PARTE 2: Habilitar RLS e criar políticas (métricas comerciais)
-- ============================================================================

-- Total de Leads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Leads') THEN
    ALTER TABLE "Total de Leads" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "total_leads_all" ON "Total de Leads";
    DROP POLICY IF EXISTS "nutri_total_leads_select" ON "Total de Leads";
    DROP POLICY IF EXISTS "nutri_total_leads_insert" ON "Total de Leads";
    DROP POLICY IF EXISTS "nutri_total_leads_update" ON "Total de Leads";
    DROP POLICY IF EXISTS "nutri_total_leads_delete" ON "Total de Leads";
    CREATE POLICY "nutri_total_leads_select" ON "Total de Leads" FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_leads_insert" ON "Total de Leads" FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_total_leads_update" ON "Total de Leads" FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_leads_delete" ON "Total de Leads" FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Total de Calls Agendadas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Calls Agendadas') THEN
    ALTER TABLE "Total de Calls Agendadas" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "total_calls_all" ON "Total de Calls Agendadas";
    DROP POLICY IF EXISTS "nutri_total_calls_select" ON "Total de Calls Agendadas";
    DROP POLICY IF EXISTS "nutri_total_calls_insert" ON "Total de Calls Agendadas";
    DROP POLICY IF EXISTS "nutri_total_calls_update" ON "Total de Calls Agendadas";
    DROP POLICY IF EXISTS "nutri_total_calls_delete" ON "Total de Calls Agendadas";
    CREATE POLICY "nutri_total_calls_select" ON "Total de Calls Agendadas" FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_calls_insert" ON "Total de Calls Agendadas" FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_total_calls_update" ON "Total de Calls Agendadas" FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_calls_delete" ON "Total de Calls Agendadas" FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Total de Leads por Funil
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Leads por Funil') THEN
    ALTER TABLE "Total de Leads por Funil" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "total_leads_funil_all" ON "Total de Leads por Funil";
    DROP POLICY IF EXISTS "nutri_total_leads_funil_select" ON "Total de Leads por Funil";
    DROP POLICY IF EXISTS "nutri_total_leads_funil_insert" ON "Total de Leads por Funil";
    DROP POLICY IF EXISTS "nutri_total_leads_funil_update" ON "Total de Leads por Funil";
    DROP POLICY IF EXISTS "nutri_total_leads_funil_delete" ON "Total de Leads por Funil";
    CREATE POLICY "nutri_total_leads_funil_select" ON "Total de Leads por Funil" FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_leads_funil_insert" ON "Total de Leads por Funil" FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_total_leads_funil_update" ON "Total de Leads por Funil" FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_leads_funil_delete" ON "Total de Leads por Funil" FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Total de Agendamentos por Funil
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Agendamentos por Funil') THEN
    ALTER TABLE "Total de Agendamentos por Funil" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "total_agend_funil_all" ON "Total de Agendamentos por Funil";
    DROP POLICY IF EXISTS "nutri_total_agend_funil_select" ON "Total de Agendamentos por Funil";
    DROP POLICY IF EXISTS "nutri_total_agend_funil_insert" ON "Total de Agendamentos por Funil";
    DROP POLICY IF EXISTS "nutri_total_agend_funil_update" ON "Total de Agendamentos por Funil";
    DROP POLICY IF EXISTS "nutri_total_agend_funil_delete" ON "Total de Agendamentos por Funil";
    CREATE POLICY "nutri_total_agend_funil_select" ON "Total de Agendamentos por Funil" FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_agend_funil_insert" ON "Total de Agendamentos por Funil" FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_total_agend_funil_update" ON "Total de Agendamentos por Funil" FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_agend_funil_delete" ON "Total de Agendamentos por Funil" FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Total de Vendas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Vendas') THEN
    ALTER TABLE "Total de Vendas" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "total_vendas_all" ON "Total de Vendas";
    DROP POLICY IF EXISTS "nutri_total_vendas_select" ON "Total de Vendas";
    DROP POLICY IF EXISTS "nutri_total_vendas_insert" ON "Total de Vendas";
    DROP POLICY IF EXISTS "nutri_total_vendas_update" ON "Total de Vendas";
    DROP POLICY IF EXISTS "nutri_total_vendas_delete" ON "Total de Vendas";
    CREATE POLICY "nutri_total_vendas_select" ON "Total de Vendas" FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_vendas_insert" ON "Total de Vendas" FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_total_vendas_update" ON "Total de Vendas" FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_vendas_delete" ON "Total de Vendas" FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Total de Vendas 2026
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Vendas 2026') THEN
    ALTER TABLE "Total de Vendas 2026" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "total_vendas_2026_all" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "nutri_total_vendas_2026_select" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "nutri_total_vendas_2026_insert" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "nutri_total_vendas_2026_update" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "nutri_total_vendas_2026_delete" ON "Total de Vendas 2026";
    CREATE POLICY "nutri_total_vendas_2026_select" ON "Total de Vendas 2026" FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_vendas_2026_insert" ON "Total de Vendas 2026" FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());
    CREATE POLICY "nutri_total_vendas_2026_update" ON "Total de Vendas 2026" FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));
    CREATE POLICY "nutri_total_vendas_2026_delete" ON "Total de Vendas 2026" FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- dashboard_metricas (pula se for VIEW; RLS não se aplica a views)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dashboard_metricas' AND table_type = 'BASE TABLE') THEN
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
    CREATE POLICY "nutri_dashboard_metricas_delete" ON public.dashboard_metricas FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- leads_que_entraram
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
    CREATE POLICY "nutri_leads_entraram_delete" ON public.leads_que_entraram FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Fim: métricas comerciais e operacionais isoladas por nutri.
