-- =====================================================
-- CORREÇÃO SIMPLES: Permitir owner ver dados da equipe
-- Execute no Supabase SQL Editor
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "daily_reports_select" ON daily_reports;
DROP POLICY IF EXISTS "Users can view own daily_reports" ON daily_reports;

-- Criar política que permite:
-- 1. Owner ver seus próprios dados
-- 2. Owner ver dados dos membros da sua equipe
-- 3. Membros verem seus próprios dados
CREATE POLICY "daily_reports_select" ON daily_reports
  FOR SELECT USING (
    -- É o próprio owner ou membro
    auth.uid() = owner_id 
    OR auth.uid() = member_id
    -- OU é o admin (owner da equipe) vendo dados dos seus membros
    OR owner_id IN (
      SELECT tm.owner_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
    -- OU o usuário logado é o owner dos membros que criaram o registro
    OR EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = daily_reports.member_id 
      AND tm.owner_id = auth.uid()
      AND tm.is_active = true
    )
  );

-- Políticas de UPDATE e DELETE
DROP POLICY IF EXISTS "daily_reports_update" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_delete" ON daily_reports;

-- UPDATE: Owner pode editar qualquer relatório da equipe, membro só o próprio
CREATE POLICY "daily_reports_update" ON daily_reports
  FOR UPDATE USING (
    auth.uid() = member_id
    OR EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = daily_reports.member_id 
      AND tm.owner_id = auth.uid()
      AND tm.is_active = true
    )
  );

-- DELETE: Owner pode deletar qualquer relatório da equipe, membro só o próprio
CREATE POLICY "daily_reports_delete" ON daily_reports
  FOR DELETE USING (
    auth.uid() = member_id
    OR EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = daily_reports.member_id 
      AND tm.owner_id = auth.uid()
      AND tm.is_active = true
    )
  );

-- Verificar se funcionou
SELECT 'Políticas criadas com sucesso!' as status;
