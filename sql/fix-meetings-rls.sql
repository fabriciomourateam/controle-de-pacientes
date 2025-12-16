-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA SISTEMA DE REUNIÕES
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
DO $$
BEGIN
  RAISE NOTICE '=== Verificando tabelas do sistema de reuniões ===';
END $$;

-- Verificar tabela daily_reports
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'daily_reports'
) AS daily_reports_exists;

-- Verificar tabela team_meetings
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'team_meetings'
) AS team_meetings_exists;

-- Verificar tabela action_items
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'action_items'
) AS action_items_exists;

-- 2. VERIFICAR DADOS EXISTENTES
SELECT 'daily_reports' as tabela, COUNT(*) as total FROM daily_reports
UNION ALL
SELECT 'team_meetings' as tabela, COUNT(*) as total FROM team_meetings
UNION ALL
SELECT 'action_items' as tabela, COUNT(*) as total FROM action_items;

-- 3. CORRIGIR POLÍTICAS RLS PARA daily_reports
DROP POLICY IF EXISTS "Users can view own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can insert own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_select" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_insert" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_update" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_delete" ON daily_reports;

-- Habilitar RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: owner ou membro pode ver
CREATE POLICY "daily_reports_select" ON daily_reports
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR auth.uid() = member_id
    OR owner_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Política de INSERT: qualquer usuário autenticado pode inserir
CREATE POLICY "daily_reports_insert" ON daily_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política de UPDATE: owner ou membro pode atualizar
CREATE POLICY "daily_reports_update" ON daily_reports
  FOR UPDATE USING (
    auth.uid() = owner_id 
    OR auth.uid() = member_id
  );

-- Política de DELETE: apenas owner pode deletar
CREATE POLICY "daily_reports_delete" ON daily_reports
  FOR DELETE USING (auth.uid() = owner_id);

-- 4. CORRIGIR POLÍTICAS RLS PARA team_meetings
DROP POLICY IF EXISTS "Users can view own team_meetings" ON team_meetings;
DROP POLICY IF EXISTS "Users can insert own team_meetings" ON team_meetings;
DROP POLICY IF EXISTS "Users can update own team_meetings" ON team_meetings;
DROP POLICY IF EXISTS "Users can delete own team_meetings" ON team_meetings;
DROP POLICY IF EXISTS "team_meetings_select" ON team_meetings;
DROP POLICY IF EXISTS "team_meetings_insert" ON team_meetings;
DROP POLICY IF EXISTS "team_meetings_update" ON team_meetings;
DROP POLICY IF EXISTS "team_meetings_delete" ON team_meetings;

-- Habilitar RLS
ALTER TABLE team_meetings ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: owner ou criador pode ver
CREATE POLICY "team_meetings_select" ON team_meetings
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR auth.uid() = created_by
    OR owner_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Política de INSERT: qualquer usuário autenticado pode inserir
CREATE POLICY "team_meetings_insert" ON team_meetings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política de UPDATE: owner ou criador pode atualizar
CREATE POLICY "team_meetings_update" ON team_meetings
  FOR UPDATE USING (
    auth.uid() = owner_id 
    OR auth.uid() = created_by
  );

-- Política de DELETE: apenas owner pode deletar
CREATE POLICY "team_meetings_delete" ON team_meetings
  FOR DELETE USING (auth.uid() = owner_id);

-- 5. CORRIGIR POLÍTICAS RLS PARA action_items
DROP POLICY IF EXISTS "Users can view own action_items" ON action_items;
DROP POLICY IF EXISTS "Users can insert own action_items" ON action_items;
DROP POLICY IF EXISTS "Users can update own action_items" ON action_items;
DROP POLICY IF EXISTS "Users can delete own action_items" ON action_items;
DROP POLICY IF EXISTS "action_items_select" ON action_items;
DROP POLICY IF EXISTS "action_items_insert" ON action_items;
DROP POLICY IF EXISTS "action_items_update" ON action_items;
DROP POLICY IF EXISTS "action_items_delete" ON action_items;

-- Habilitar RLS
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: owner, responsável ou criador pode ver
CREATE POLICY "action_items_select" ON action_items
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR auth.uid() = assigned_to
    OR auth.uid() = created_by
    OR owner_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Política de INSERT: qualquer usuário autenticado pode inserir
CREATE POLICY "action_items_insert" ON action_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política de UPDATE: owner, responsável ou criador pode atualizar
CREATE POLICY "action_items_update" ON action_items
  FOR UPDATE USING (
    auth.uid() = owner_id 
    OR auth.uid() = assigned_to
    OR auth.uid() = created_by
  );

-- Política de DELETE: apenas owner pode deletar
CREATE POLICY "action_items_delete" ON action_items
  FOR DELETE USING (auth.uid() = owner_id);

-- 6. VERIFICAR POLÍTICAS CRIADAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('daily_reports', 'team_meetings', 'action_items')
ORDER BY tablename, policyname;

-- 7. VERIFICAR DADOS NOVAMENTE
SELECT 'Verificação concluída!' as status;
