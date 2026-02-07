-- ============================================================================
-- RLS POR TABELA – MÉTRICAS COMERCIAIS
-- ============================================================================
-- Execute UM BLOCO POR VEZ (Tabela 18, depois 19, etc.).
-- Requer: já ter rodado sql/rls-isolamento-por-nutri.sql (função get_member_owner_id existe).
-- Antes de habilitar RLS: popular user_id nos dados existentes (UPDATE ... SET user_id = 'UUID-DO-NUTRI' WHERE user_id IS NULL).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 18: Total de Leads (execute só este bloco se quiser só esta tabela)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Leads' AND column_name = 'user_id') THEN
    ALTER TABLE "Total de Leads" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_total_de_leads_user_id ON "Total de Leads"(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em Total de Leads';
  END IF;
END $$;

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

CREATE POLICY "nutri_total_leads_delete" ON "Total de Leads" FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- TABELA 19: Total de Calls Agendadas
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Calls Agendadas' AND column_name = 'user_id') THEN
    ALTER TABLE "Total de Calls Agendadas" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_total_de_calls_user_id ON "Total de Calls Agendadas"(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em Total de Calls Agendadas';
  END IF;
END $$;

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

CREATE POLICY "nutri_total_calls_delete" ON "Total de Calls Agendadas" FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- TABELA 20: Total de Leads por Funil
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Leads por Funil' AND column_name = 'user_id') THEN
    ALTER TABLE "Total de Leads por Funil" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_total_leads_funil_user_id ON "Total de Leads por Funil"(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em Total de Leads por Funil';
  END IF;
END $$;

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

CREATE POLICY "nutri_total_leads_funil_delete" ON "Total de Leads por Funil" FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- TABELA 21: Total de Agendamentos por Funil
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Agendamentos por Funil' AND column_name = 'user_id') THEN
    ALTER TABLE "Total de Agendamentos por Funil" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_total_agend_funil_user_id ON "Total de Agendamentos por Funil"(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em Total de Agendamentos por Funil';
  END IF;
END $$;

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

CREATE POLICY "nutri_total_agend_funil_delete" ON "Total de Agendamentos por Funil" FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- TABELA 22: Total de Vendas
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Vendas' AND column_name = 'user_id') THEN
    ALTER TABLE "Total de Vendas" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_total_de_vendas_user_id ON "Total de Vendas"(user_id);
    RAISE NOTICE 'Coluna user_id adicionada em Total de Vendas';
  END IF;
END $$;

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

CREATE POLICY "nutri_total_vendas_delete" ON "Total de Vendas" FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- TABELA 23: Total de Vendas 2026 (só execute se a tabela existir)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Vendas 2026') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Total de Vendas 2026' AND column_name = 'user_id') THEN
      ALTER TABLE "Total de Vendas 2026" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_total_vendas_2026_user_id ON "Total de Vendas 2026"(user_id);
      RAISE NOTICE 'Coluna user_id adicionada em Total de Vendas 2026';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Total de Vendas 2026') THEN
    ALTER TABLE "Total de Vendas 2026" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "total_vendas_2026_all" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "total_vendas_2026_select" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "total_vendas_2026_insert" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "total_vendas_2026_update" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "total_vendas_2026_delete" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "Users can only see their own vendas 2026" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "Users can only insert their own vendas 2026" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "Users can only update their own vendas 2026" ON "Total de Vendas 2026";
    DROP POLICY IF EXISTS "Users can only delete their own vendas 2026" ON "Total de Vendas 2026";

    CREATE POLICY "nutri_total_vendas_2026_select" ON "Total de Vendas 2026" FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));

    CREATE POLICY "nutri_total_vendas_2026_insert" ON "Total de Vendas 2026" FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR user_id = get_member_owner_id());

    CREATE POLICY "nutri_total_vendas_2026_update" ON "Total de Vendas 2026" FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id()));

    CREATE POLICY "nutri_total_vendas_2026_delete" ON "Total de Vendas 2026" FOR DELETE TO authenticated
      USING (user_id = auth.uid());

    RAISE NOTICE 'RLS aplicado em Total de Vendas 2026';
  END IF;
END $$;
