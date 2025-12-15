-- ============================================================================
-- VERIFICAR SE HÁ DADOS NAS TABELAS DE DIETAS
-- ============================================================================

-- 1. Contar registros em cada tabela
SELECT 'diet_plans' as tabela, COUNT(*) as total FROM diet_plans
UNION ALL
SELECT 'diet_meals' as tabela, COUNT(*) as total FROM diet_meals
UNION ALL
SELECT 'diet_foods' as tabela, COUNT(*) as total FROM diet_foods;

-- 2. Ver exemplo de diet_plan
SELECT 
  id,
  patient_id,
  name,
  status,
  created_at
FROM diet_plans
ORDER BY created_at DESC
LIMIT 3;

-- 3. Ver se há meals para essas dietas
SELECT 
  dm.id,
  dm.diet_plan_id,
  dm.meal_type,
  dm.meal_name,
  COUNT(df.id) as total_alimentos
FROM diet_meals dm
LEFT JOIN diet_foods df ON df.meal_id = dm.id
GROUP BY dm.id, dm.diet_plan_id, dm.meal_type, dm.meal_name
ORDER BY dm.created_at DESC
LIMIT 10;

-- 4. Ver políticas RLS das tabelas de dietas
SELECT 
  tablename,
  policyname,
  cmd,
  qual AS using_expression
FROM pg_policies
WHERE tablename IN ('diet_plans', 'diet_meals', 'diet_foods')
ORDER BY tablename, policyname;

-- ============================================================================
-- FIM
-- ============================================================================
