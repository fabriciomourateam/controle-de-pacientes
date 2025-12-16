-- =====================================================
-- DIAGNÓSTICO: Dietas cadastradas pelo N8N não aparecem
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1. Verificar se existem planos de dieta
SELECT 
  id, 
  name, 
  patient_id, 
  user_id,
  status,
  is_released,
  created_at
FROM diet_plans 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Verificar se existem refeições (diet_meals)
SELECT 
  dm.id,
  dm.diet_plan_id,
  dm.meal_name,
  dm.user_id,
  dp.name as plan_name,
  dp.user_id as plan_user_id
FROM diet_meals dm
LEFT JOIN diet_plans dp ON dm.diet_plan_id = dp.id
ORDER BY dm.created_at DESC
LIMIT 20;

-- 3. Verificar estrutura da tabela diet_foods
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diet_foods'
ORDER BY ordinal_position;

-- 3b. Verificar se existem alimentos (diet_foods)
SELECT * FROM diet_foods ORDER BY created_at DESC LIMIT 10;

-- 4. Verificar políticas RLS atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('diet_plans', 'diet_meals', 'diet_foods')
ORDER BY tablename, policyname;

-- 5. Verificar se há registros sem user_id (problema comum com N8N)
SELECT 'diet_plans sem user_id' as problema, COUNT(*) as total 
FROM diet_plans WHERE user_id IS NULL
UNION ALL
SELECT 'diet_meals sem user_id' as problema, COUNT(*) as total 
FROM diet_meals WHERE user_id IS NULL;

-- 6. Se houver registros sem user_id, você pode atualizar com:
-- (Substitua 'SEU_USER_ID' pelo seu user_id real)
-- UPDATE diet_plans SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE diet_meals SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;

-- 7. Verificar estrutura da tabela diet_meals
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diet_meals'
ORDER BY ordinal_position;
