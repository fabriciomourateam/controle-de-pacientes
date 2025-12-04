-- =====================================================
-- LIMPAR POLÍTICAS RLS DUPLICADAS
-- =====================================================
-- Este script remove políticas duplicadas mantendo apenas as corretas
-- =====================================================

-- Limpar políticas duplicadas de leads_que_entraram
DO $$
BEGIN
    -- Remover políticas antigas/duplicadas
    DROP POLICY IF EXISTS "Users can only delete their own data" ON leads_que_entraram;
    DROP POLICY IF EXISTS "Users can only insert their own data" ON leads_que_entraram;
    DROP POLICY IF EXISTS "Users can only see their own data" ON leads_que_entraram;
    DROP POLICY IF EXISTS "Users can only update their own data" ON leads_que_entraram;
    
    -- Manter apenas as políticas corretas (já devem existir)
    -- Se não existirem, criar novamente
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads_que_entraram' 
        AND policyname = 'Users can only see their own leads'
    ) THEN
        CREATE POLICY "Users can only see their own leads" ON leads_que_entraram
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads_que_entraram' 
        AND policyname = 'Users can only insert their own leads'
    ) THEN
        CREATE POLICY "Users can only insert their own leads" ON leads_que_entraram
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads_que_entraram' 
        AND policyname = 'Users can only update their own leads'
    ) THEN
        CREATE POLICY "Users can only update their own leads" ON leads_que_entraram
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads_que_entraram' 
        AND policyname = 'Users can only delete their own leads'
    ) THEN
        CREATE POLICY "Users can only delete their own leads" ON leads_que_entraram
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    RAISE NOTICE 'Políticas duplicadas removidas de leads_que_entraram';
END $$;

-- Verificar resultado
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'leads_que_entraram'
ORDER BY cmd, policyname;

