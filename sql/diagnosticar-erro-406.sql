-- ============================================================================
-- DIAGNOSTICAR ERRO 406 EM USER_SUBSCRIPTIONS
-- ============================================================================
-- Investigar o que está causando o erro 406 (Not Acceptable)
-- ============================================================================

-- 1. Ver estrutura completa de user_subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 2. Ver estrutura completa de subscription_plans
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 3. Verificar foreign keys (relacionamentos)
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_subscriptions';

-- 4. Ver TODAS as políticas RLS atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename IN ('user_subscriptions', 'subscription_plans')
ORDER BY tablename, policyname;

-- 5. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_subscriptions', 'subscription_plans');

-- 6. Testar se consegue fazer SELECT simples
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Testar subscription_plans
  SELECT COUNT(*) INTO v_count FROM subscription_plans;
  RAISE NOTICE 'Total de subscription_plans: %', v_count;
  
  -- Testar user_subscriptions
  SELECT COUNT(*) INTO v_count FROM user_subscriptions;
  RAISE NOTICE 'Total de user_subscriptions: %', v_count;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERRO ao contar: %', SQLERRM;
END $$;

-- 7. Testar JOIN entre as tabelas (o que o código está tentando fazer)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_subscriptions us
  LEFT JOIN subscription_plans sp ON sp.id = us.subscription_plan_id;
  
  RAISE NOTICE 'Total de user_subscriptions com JOIN: %', v_count;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERRO no JOIN: %', SQLERRM;
END $$;

-- 8. Ver dados de exemplo (se existirem)
SELECT 
  'subscription_plans' as tabela,
  id,
  name,
  display_name,
  active
FROM subscription_plans
LIMIT 3;

SELECT 
  'user_subscriptions' as tabela,
  id,
  user_id,
  subscription_plan_id,
  status
FROM user_subscriptions
LIMIT 3;

-- ============================================================================
-- FIM DO DIAGNÓSTICO
-- ============================================================================
