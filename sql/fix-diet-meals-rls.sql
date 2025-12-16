-- CORREÇÃO: Políticas RLS para diet_meals e diet_foods
-- Execute no Supabase SQL Editor

-- 1. Verificar políticas atuais
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('diet_meals', 'diet_foods', 'diet_guidelines');

-- 2. Habilitar RLS nas tabelas
ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_guidelines ENABLE ROW LEVEL SECURITY;

-- 3. Dropar políticas existentes de diet_meals
DROP POLICY IF EXISTS "diet_meals_all" ON diet_meals;
DROP POLICY IF EXISTS "diet_meals_select" ON diet_meals;
DROP POLICY IF EXISTS "diet_meals_insert" ON diet_meals;
DROP POLICY IF EXISTS "diet_meals_update" ON diet_meals;
DROP POLICY IF EXISTS "diet_meals_delete" ON diet_meals;
DROP POLICY IF EXISTS "Users can view diet meals" ON diet_meals;
DROP POLICY IF EXISTS "Users can manage diet meals" ON diet_meals;

-- 4. Dropar políticas existentes de diet_foods
DROP POLICY IF EXISTS "diet_foods_all" ON diet_foods;
DROP POLICY IF EXISTS "diet_foods_select" ON diet_foods;
DROP POLICY IF EXISTS "diet_foods_insert" ON diet_foods;
DROP POLICY IF EXISTS "diet_foods_update" ON diet_foods;
DROP POLICY IF EXISTS "diet_foods_delete" ON diet_foods;
DROP POLICY IF EXISTS "Users can view diet foods" ON diet_foods;
DROP POLICY IF EXISTS "Users can manage diet foods" ON diet_foods;

-- 5. Dropar políticas existentes de diet_guidelines
DROP POLICY IF EXISTS "diet_guidelines_all" ON diet_guidelines;
DROP POLICY IF EXISTS "diet_guidelines_select" ON diet_guidelines;
DROP POLICY IF EXISTS "Users can view diet guidelines" ON diet_guidelines;
DROP POLICY IF EXISTS "Users can manage diet guidelines" ON diet_guidelines;

-- 6. Criar política para diet_meals (baseada no diet_plan)
CREATE POLICY "diet_meals_all"
ON diet_meals FOR ALL
USING (
  diet_plan_id IN (
    SELECT id FROM diet_plans 
    WHERE user_id = auth.uid() 
    OR is_team_member(user_id)
  )
)
WITH CHECK (
  diet_plan_id IN (
    SELECT id FROM diet_plans 
    WHERE user_id = auth.uid() 
    OR is_team_member(user_id)
  )
);

-- 7. Criar política para diet_foods (baseada no meal -> plan)
CREATE POLICY "diet_foods_all"
ON diet_foods FOR ALL
USING (
  meal_id IN (
    SELECT dm.id FROM diet_meals dm
    JOIN diet_plans dp ON dm.diet_plan_id = dp.id
    WHERE dp.user_id = auth.uid() 
    OR is_team_member(dp.user_id)
  )
)
WITH CHECK (
  meal_id IN (
    SELECT dm.id FROM diet_meals dm
    JOIN diet_plans dp ON dm.diet_plan_id = dp.id
    WHERE dp.user_id = auth.uid() 
    OR is_team_member(dp.user_id)
  )
);

-- 8. Criar política para diet_guidelines (baseada no diet_plan)
CREATE POLICY "diet_guidelines_all"
ON diet_guidelines FOR ALL
USING (
  diet_plan_id IN (
    SELECT id FROM diet_plans 
    WHERE user_id = auth.uid() 
    OR is_team_member(user_id)
  )
)
WITH CHECK (
  diet_plan_id IN (
    SELECT id FROM diet_plans 
    WHERE user_id = auth.uid() 
    OR is_team_member(user_id)
  )
);

-- 9. Verificar se as políticas foram criadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('diet_meals', 'diet_foods', 'diet_guidelines');

-- 10. Testar se agora consegue ver as refeições
SELECT dm.id, dm.meal_name, dm.diet_plan_id
FROM diet_meals dm
JOIN diet_plans dp ON dm.diet_plan_id = dp.id
WHERE dp.patient_id = '7261e2ad-bf7f-48ba-9967-9b9580c06bc5';
