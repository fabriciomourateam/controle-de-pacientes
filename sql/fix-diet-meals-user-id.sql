-- ============================================================================
-- CORRIGIR USER_ID DAS DIET_MEALS E DIET_FOODS
-- ============================================================================
-- Problema: diet_meals e diet_foods não têm user_id, então RLS bloqueia tudo
-- Solução: Adicionar user_id baseado no diet_plan
-- ============================================================================

-- 1. Atualizar diet_meals com o user_id do diet_plan
UPDATE diet_meals dm
SET user_id = dp.user_id
FROM diet_plans dp
WHERE dm.diet_plan_id = dp.id
  AND dm.user_id IS NULL;

-- 2. Verificar quantos foram atualizados
SELECT 
  'diet_meals atualizados' as info,
  COUNT(*) as total
FROM diet_meals
WHERE user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b';

-- 3. Verificar se ainda há meals sem user_id
SELECT 
  'diet_meals sem user_id' as info,
  COUNT(*) as total
FROM diet_meals
WHERE user_id IS NULL;

-- ============================================================================
-- EXPLICAÇÃO:
-- - diet_meals estava sem user_id
-- - Agora pegamos o user_id do diet_plan correspondente
-- - Isso permite que o RLS funcione corretamente
-- ============================================================================
