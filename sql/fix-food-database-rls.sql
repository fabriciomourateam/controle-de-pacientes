-- =====================================================
-- FIX: Permissões RLS para food_database e tabelas relacionadas
-- =====================================================
-- Corrige os erros 403 e 406 ao cadastrar e usar alimentos
-- 
-- Erros corrigidos:
-- 1. food_database INSERT: 403 Forbidden (não pode cadastrar novos alimentos)
-- 2. food_usage_stats: 406 Not Acceptable (RLS bloqueando)
-- 3. user_favorite_foods: 406 Not Acceptable (RLS bloqueando)
-- =====================================================

-- =====================================================
-- 1. FOOD_DATABASE - Permitir INSERT para usuários autenticados
-- =====================================================

-- Verificar se a tabela existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'food_database') THEN
    RAISE NOTICE '✅ Tabela food_database existe';
  ELSE
    RAISE EXCEPTION '❌ Tabela food_database não existe!';
  END IF;
END $$;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas que podem estar causando conflito
DROP POLICY IF EXISTS "food_database_select_policy" ON public.food_database;
DROP POLICY IF EXISTS "food_database_insert_policy" ON public.food_database;
DROP POLICY IF EXISTS "food_database_update_policy" ON public.food_database;
DROP POLICY IF EXISTS "food_database_delete_policy" ON public.food_database;

-- SELECT: Todos podem ler alimentos (banco compartilhado)
CREATE POLICY "food_database_select_policy"
ON public.food_database
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Usuários autenticados podem cadastrar novos alimentos
-- Banco compartilhado - todos podem adicionar
CREATE POLICY "food_database_insert_policy"
ON public.food_database
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Todos autenticados podem atualizar (banco compartilhado)
-- Se precisar restringir no futuro, adicione coluna user_id
CREATE POLICY "food_database_update_policy"
ON public.food_database
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Todos autenticados podem deletar (banco compartilhado)
-- Se precisar restringir no futuro, adicione coluna user_id
CREATE POLICY "food_database_delete_policy"
ON public.food_database
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- 2. FOOD_USAGE_STATS - Corrigir erro 406
-- =====================================================

-- Verificar se a tabela existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'food_usage_stats') THEN
    RAISE NOTICE '✅ Tabela food_usage_stats existe';
  ELSE
    RAISE NOTICE '⚠️ Tabela food_usage_stats não existe, pulando...';
  END IF;
END $$;

-- Só executar se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'food_usage_stats') THEN
    -- Habilitar RLS
    ALTER TABLE public.food_usage_stats ENABLE ROW LEVEL SECURITY;

    -- Remover policies antigas
    DROP POLICY IF EXISTS "food_usage_stats_select_policy" ON public.food_usage_stats;
    DROP POLICY IF EXISTS "food_usage_stats_insert_policy" ON public.food_usage_stats;
    DROP POLICY IF EXISTS "food_usage_stats_update_policy" ON public.food_usage_stats;
    DROP POLICY IF EXISTS "food_usage_stats_delete_policy" ON public.food_usage_stats;

    -- SELECT: Usuário vê apenas seus próprios registros
    EXECUTE 'CREATE POLICY "food_usage_stats_select_policy"
    ON public.food_usage_stats
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid())';

    -- INSERT: Usuário pode inserir seus próprios registros
    EXECUTE 'CREATE POLICY "food_usage_stats_insert_policy"
    ON public.food_usage_stats
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid())';

    -- UPDATE: Usuário pode atualizar seus próprios registros
    EXECUTE 'CREATE POLICY "food_usage_stats_update_policy"
    ON public.food_usage_stats
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid())';

    -- DELETE: Usuário pode deletar seus próprios registros
    EXECUTE 'CREATE POLICY "food_usage_stats_delete_policy"
    ON public.food_usage_stats
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid())';

    RAISE NOTICE '✅ Policies de food_usage_stats criadas';
  END IF;
END $$;

-- =====================================================
-- 3. USER_FAVORITE_FOODS - Corrigir erro 406
-- =====================================================

-- Verificar se a tabela existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_favorite_foods') THEN
    RAISE NOTICE '✅ Tabela user_favorite_foods existe';
  ELSE
    RAISE NOTICE '⚠️ Tabela user_favorite_foods não existe, pulando...';
  END IF;
END $$;

-- Só executar se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_favorite_foods') THEN
    -- Habilitar RLS
    ALTER TABLE public.user_favorite_foods ENABLE ROW LEVEL SECURITY;

    -- Remover policies antigas
    DROP POLICY IF EXISTS "user_favorite_foods_select_policy" ON public.user_favorite_foods;
    DROP POLICY IF EXISTS "user_favorite_foods_insert_policy" ON public.user_favorite_foods;
    DROP POLICY IF EXISTS "user_favorite_foods_update_policy" ON public.user_favorite_foods;
    DROP POLICY IF EXISTS "user_favorite_foods_delete_policy" ON public.user_favorite_foods;

    -- SELECT: Usuário vê apenas seus próprios favoritos
    EXECUTE 'CREATE POLICY "user_favorite_foods_select_policy"
    ON public.user_favorite_foods
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid())';

    -- INSERT: Usuário pode inserir seus próprios favoritos
    EXECUTE 'CREATE POLICY "user_favorite_foods_insert_policy"
    ON public.user_favorite_foods
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid())';

    -- UPDATE: Usuário pode atualizar seus próprios favoritos
    EXECUTE 'CREATE POLICY "user_favorite_foods_update_policy"
    ON public.user_favorite_foods
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid())';

    -- DELETE: Usuário pode deletar seus próprios favoritos
    EXECUTE 'CREATE POLICY "user_favorite_foods_delete_policy"
    ON public.user_favorite_foods
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid())';

    RAISE NOTICE '✅ Policies de user_favorite_foods criadas';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar policies criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- food_database
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'food_database';
  
  RAISE NOTICE '📊 food_database tem % policies', policy_count;
  
  -- food_usage_stats
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'food_usage_stats') THEN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'food_usage_stats';
    
    RAISE NOTICE '📊 food_usage_stats tem % policies', policy_count;
  END IF;
  
  -- user_favorite_foods
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_favorite_foods') THEN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_favorite_foods';
    
    RAISE NOTICE '📊 user_favorite_foods tem % policies', policy_count;
  END IF;
END $$;

-- =====================================================
-- RESUMO
-- =====================================================
-- ✅ food_database: Permite INSERT para usuários autenticados
-- ✅ food_usage_stats: Corrigido erro 406 (RLS por user_id)
-- ✅ user_favorite_foods: Corrigido erro 406 (RLS por user_id)
-- 
-- PRÓXIMOS PASSOS:
-- 1. Executar este SQL no Supabase SQL Editor
-- 2. Testar cadastro de novo alimento
-- 3. Testar edição de nome de alimento existente
-- 4. Verificar que não há mais erros 403/406 no console
-- =====================================================
