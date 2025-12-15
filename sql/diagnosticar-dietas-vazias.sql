-- ============================================================================
-- DIAGNOSTICAR POR QUE AS DIETAS ESTÃO VAZIAS
-- ============================================================================

-- 1. Verificar se existem dietas no banco
SELECT 
  'Total de dietas' as info,
  COUNT(*) as total
FROM diet_plans;

-- 2. Ver algumas dietas de exemplo
SELECT 
  id,
  patient_id,
  name,
  created_at,
  LENGTH(meals::text) as tamanho_meals
FROM diet_plans
ORDER BY created_at DESC
LIMIT 5;

-- 3. Ver o conteúdo de uma dieta (meals)
SELECT 
  id,
  name,
  meals
FROM diet_plans
WHERE meals IS NOT NULL
  AND meals::text != '[]'
  AND meals::text != 'null'
LIMIT 1;

-- 4. Verificar políticas RLS de diet_plans
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'diet_plans'
ORDER BY policyname;

-- 5. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'diet_plans';

-- 6. Contar dietas por paciente
SELECT 
  patient_id,
  COUNT(*) as total_dietas
FROM diet_plans
GROUP BY patient_id
ORDER BY total_dietas DESC
LIMIT 10;

-- ============================================================================
-- FIM
-- ============================================================================
