-- =====================================================
-- RESTAURAR POLÍTICA RLS DE INSERT NA TABELA PATIENTS
-- =====================================================
-- Este script recria a política RLS de INSERT que foi deletada
-- =====================================================

-- Verificar se RLS está habilitado
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir (para evitar duplicatas)
DROP POLICY IF EXISTS "Users can only insert their own patients" ON patients;

-- Recriar política RLS de INSERT
CREATE POLICY "Users can only insert their own patients" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verificar se a política foi criada
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
WHERE tablename = 'patients'
  AND policyname = 'Users can only insert their own patients';

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- ✅ Política RLS de INSERT restaurada!
-- 
-- Esta política garante que:
-- - Usuários só podem inserir pacientes com user_id = seu próprio ID
-- - O trigger set_user_id_patients garante que user_id seja preenchido automaticamente
-- =====================================================

