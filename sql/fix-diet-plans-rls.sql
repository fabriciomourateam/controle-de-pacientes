-- CORREÇÃO: Políticas RLS para diet_plans
-- Execute este SQL no Supabase SQL Editor

-- Verificar se RLS está habilitado
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- Dropar todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can view diet plans of their patients" ON diet_plans;
DROP POLICY IF EXISTS "Users can insert own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can insert diet plans for their patients" ON diet_plans;
DROP POLICY IF EXISTS "Users can update own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can update diet plans of their patients" ON diet_plans;
DROP POLICY IF EXISTS "Users can delete own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can delete diet plans of their patients" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_select_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_insert_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_update_policy" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_delete_policy" ON diet_plans;

-- Criar política SELECT simples
CREATE POLICY "diet_plans_select_policy"
ON diet_plans FOR SELECT
USING (
  user_id = auth.uid()
  OR created_by = auth.uid()
);

-- Criar política INSERT
CREATE POLICY "diet_plans_insert_policy"
ON diet_plans FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR created_by = auth.uid()
);

-- Criar política UPDATE
CREATE POLICY "diet_plans_update_policy"
ON diet_plans FOR UPDATE
USING (
  user_id = auth.uid()
  OR created_by = auth.uid()
);

-- Criar política DELETE
CREATE POLICY "diet_plans_delete_policy"
ON diet_plans FOR DELETE
USING (
  user_id = auth.uid()
  OR created_by = auth.uid()
);

-- Verificar políticas criadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'diet_plans';

-- Testar se agora consegue ver os planos
SELECT id, name, user_id, created_by, status 
FROM diet_plans 
WHERE user_id = auth.uid() OR created_by = auth.uid();
