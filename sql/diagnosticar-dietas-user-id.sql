-- DIAGNÓSTICO: Por que dietas do N8N não aparecem na interface do nutricionista
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver todos os planos e seus user_ids
SELECT 
  dp.id,
  dp.name,
  dp.patient_id,
  dp.user_id as plan_user_id,
  dp.status,
  dp.is_released,
  dp.created_at,
  p.nome as patient_name,
  p.user_id as patient_user_id
FROM diet_plans dp
LEFT JOIN patients p ON dp.patient_id = p.id
ORDER BY dp.created_at DESC
LIMIT 20;

-- 2. Ver o user_id do usuário autenticado atual
SELECT auth.uid() as current_user_id;

-- 3. Verificar políticas RLS na tabela diet_plans
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'diet_plans';

-- 4. Verificar se RLS está habilitado
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'diet_plans';

-- 5. Contar planos por user_id
SELECT 
  user_id,
  COUNT(*) as total_plans,
  COUNT(CASE WHEN is_released = true THEN 1 END) as released_plans
FROM diet_plans
GROUP BY user_id;

-- 6. Verificar se o paciente específico tem planos
-- Substitua o ID pelo patient_id correto
SELECT 
  dp.*,
  (SELECT COUNT(*) FROM diet_meals WHERE diet_plan_id = dp.id) as total_meals
FROM diet_plans dp
WHERE dp.patient_id = '7261e2ad-bf7f-48ba-9967-9b9580c06bc5';
