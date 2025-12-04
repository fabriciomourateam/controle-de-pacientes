-- =====================================================
-- CORRIGIR POLÍTICAS RLS DA TABELA PLANS
-- =====================================================
-- Este script remove políticas problemáticas que permitem
-- acesso a todos os planos e mantém apenas as políticas
-- que garantem isolamento por user_id.
--
-- ⚠️ IMPORTANTE: Execute este script para garantir segurança!
-- =====================================================

-- =====================================================
-- ETAPA 1: Remover políticas problemáticas
-- =====================================================

-- Remover política que permite acesso total a usuários autenticados
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON plans;

-- Remover política que permite leitura de todos os planos
DROP POLICY IF EXISTS "Allow read access to plans" ON plans;

-- =====================================================
-- ETAPA 2: Remover políticas duplicadas (manter apenas as mais específicas)
-- =====================================================

-- Remover políticas genéricas (manter as específicas "Users can only see their own plans")
DROP POLICY IF EXISTS "Users can only see their own data" ON plans;
DROP POLICY IF EXISTS "Users can only insert their own data" ON plans;
DROP POLICY IF EXISTS "Users can only update their own data" ON plans;
DROP POLICY IF EXISTS "Users can only delete their own data" ON plans;

-- =====================================================
-- ETAPA 3: Garantir que as políticas corretas existem
-- =====================================================

-- Verificar e criar política SELECT se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plans' 
        AND policyname = 'Users can only see their own plans'
    ) THEN
        CREATE POLICY "Users can only see their own plans" ON plans
            FOR SELECT 
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Verificar e criar política INSERT se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plans' 
        AND policyname = 'Users can only insert their own plans'
    ) THEN
        CREATE POLICY "Users can only insert their own plans" ON plans
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Verificar e criar política UPDATE se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plans' 
        AND policyname = 'Users can only update their own plans'
    ) THEN
        CREATE POLICY "Users can only update their own plans" ON plans
            FOR UPDATE 
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Verificar e criar política DELETE se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plans' 
        AND policyname = 'Users can only delete their own plans'
    ) THEN
        CREATE POLICY "Users can only delete their own plans" ON plans
            FOR DELETE 
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- ETAPA 4: Verificar se RLS está habilitado
-- =====================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ETAPA 5: Verificar políticas finais
-- =====================================================

-- Listar todas as políticas após a limpeza
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Ver planos'
        WHEN cmd = 'INSERT' THEN 'Criar planos'
        WHEN cmd = 'UPDATE' THEN 'Editar planos'
        WHEN cmd = 'DELETE' THEN 'Deletar planos'
        ELSE cmd
    END as descricao,
    qual as condicao_using,
    with_check as condicao_with_check
FROM pg_policies
WHERE tablename = 'plans'
ORDER BY cmd, policyname;

-- =====================================================
-- VERIFICAÇÃO DE SEGURANÇA
-- =====================================================
-- Após executar, você deve ver APENAS 4 políticas:
-- 1. "Users can only see their own plans" (SELECT)
-- 2. "Users can only insert their own plans" (INSERT)
-- 3. "Users can only update their own plans" (UPDATE)
-- 4. "Users can only delete their own plans" (DELETE)
--
-- Se aparecer mais de 4 políticas ou alguma com "true" ou 
-- "authenticated", há um problema de segurança!





