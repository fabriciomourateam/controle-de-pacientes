-- =====================================================
-- HABILITAR RLS E POLÍTICAS PARA TABELA PLANS
-- =====================================================
-- Este script adiciona Row Level Security (RLS) na tabela plans
-- para garantir que cada nutricionista veja apenas seus próprios planos.
--
-- ⚠️ IMPORTANTE: Execute este script para garantir isolamento total!
-- =====================================================

-- =====================================================
-- ETAPA 1: Habilitar RLS na tabela plans
-- =====================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ETAPA 2: Remover políticas antigas (se existirem)
-- =====================================================

DROP POLICY IF EXISTS "Users can only see their own plans" ON plans;
DROP POLICY IF EXISTS "Users can only insert their own plans" ON plans;
DROP POLICY IF EXISTS "Users can only update their own plans" ON plans;
DROP POLICY IF EXISTS "Users can only delete their own plans" ON plans;
DROP POLICY IF EXISTS "Authenticated users can view all plans" ON plans;
DROP POLICY IF EXISTS "Authenticated users can manage all plans" ON plans;

-- =====================================================
-- ETAPA 3: Criar políticas RLS para plans
-- =====================================================

-- Política para SELECT - usuários só veem seus próprios planos
CREATE POLICY "Users can only see their own plans" ON plans
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Política para INSERT - usuários só podem criar planos para si mesmos
CREATE POLICY "Users can only insert their own plans" ON plans
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE - usuários só podem editar seus próprios planos
CREATE POLICY "Users can only update their own plans" ON plans
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE - usuários só podem deletar seus próprios planos
CREATE POLICY "Users can only delete their own plans" ON plans
    FOR DELETE 
    USING (auth.uid() = user_id);

-- =====================================================
-- ETAPA 4: Verificar se o trigger set_user_id já existe
-- =====================================================

-- Verificar se o trigger já existe (pode ter sido criado anteriormente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_user_id_plans'
    ) THEN
        -- Criar trigger para garantir que user_id seja sempre definido
        CREATE TRIGGER set_user_id_plans
            BEFORE INSERT ON plans
            FOR EACH ROW
            EXECUTE FUNCTION set_user_id();
        
        RAISE NOTICE 'Trigger set_user_id_plans criado';
    ELSE
        RAISE NOTICE 'Trigger set_user_id_plans já existe';
    END IF;
END $$;

-- =====================================================
-- ETAPA 5: Verificar configuração
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'plans';

-- Listar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'plans'
ORDER BY cmd, policyname;

-- =====================================================
-- VERIFICAÇÃO DE SEGURANÇA
-- =====================================================
-- Execute estas queries para verificar se está funcionando:

-- 1. Ver quantos planos cada usuário tem:
-- SELECT 
--     user_id,
--     COUNT(*) as total_plans,
--     STRING_AGG(name, ', ' ORDER BY name) as plan_names
-- FROM plans
-- WHERE user_id IS NOT NULL
-- GROUP BY user_id;

-- 2. Testar isolamento (execute com um user_id específico):
-- SELECT COUNT(*) as total_plans_visiveis
-- FROM plans;
-- -- Deve retornar apenas os planos do usuário logado

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Com essas políticas, cada nutricionista:
-- ✅ Só vê seus próprios planos
-- ✅ Só cria planos para si mesmo
-- ✅ Só edita seus próprios planos
-- ✅ Só deleta seus próprios planos
-- 
-- O trigger garante que user_id seja sempre definido
-- automaticamente, mesmo que não seja passado no código.








