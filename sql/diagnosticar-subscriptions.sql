-- ============================================================================
-- DIAGNOSTICAR PROBLEMA COM USER_SUBSCRIPTIONS
-- ============================================================================

-- 1. Verificar se as tabelas existem
SELECT 
  'user_subscriptions' as tabela,
  EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_subscriptions'
  ) as existe;

SELECT 
  'subscription_plans' as tabela,
  EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_plans'
  ) as existe;

-- 2. Ver estrutura de user_subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 3. Ver estrutura de subscription_plans
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 4. Verificar relacionamentos (foreign keys)
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('user_subscriptions', 'subscription_plans');

-- 5. Verificar políticas RLS
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
WHERE tablename IN ('user_subscriptions', 'subscription_plans')
ORDER BY tablename, policyname;

-- 6. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_subscriptions', 'subscription_plans');

-- 7. Contar registros (se as tabelas existirem)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_subscriptions') THEN
    RAISE NOTICE 'Total de user_subscriptions: %', (SELECT COUNT(*) FROM user_subscriptions);
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plans') THEN
    RAISE NOTICE 'Total de subscription_plans: %', (SELECT COUNT(*) FROM subscription_plans);
  END IF;
END $$;

-- ============================================================================
-- FIM
-- ============================================================================
