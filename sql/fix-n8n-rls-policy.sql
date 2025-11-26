-- =====================================================
-- SOLUÇÃO PARA N8N: POLÍTICA RLS ESPECIAL PARA WEBHOOKS
-- =====================================================
-- Este script cria uma política que permite inserts/updates
-- via Service Role Key (usado pelo n8n)
-- =====================================================

-- ⚠️ IMPORTANTE: Esta política permite que o Service Role Key
-- (usado pelo n8n) faça inserts/updates sem restrições de RLS
-- Os dados serão vinculados ao user_id correto via trigger ou código

-- Para a tabela patients:
-- A política atual já permite inserts com user_id correto
-- O Service Role Key bypassa RLS automaticamente, então não precisa de política especial

-- Verificar se as políticas atuais estão funcionando:
SELECT 
    policyname,
    cmd as operacao,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Ver dados'
        WHEN cmd = 'INSERT' THEN 'Inserir dados'
        WHEN cmd = 'UPDATE' THEN 'Atualizar dados'
        WHEN cmd = 'DELETE' THEN 'Deletar dados'
        ELSE cmd
    END as descricao,
    with_check as condicao
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY cmd;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- O Service Role Key do Supabase BYPASSA todas as políticas RLS
-- automaticamente. Portanto, o n8n pode fazer inserts/updates
-- sem problemas, desde que:
-- 
-- 1. Use a Service Role Key (não a anon key)
-- 2. Defina o user_id corretamente no código
-- 
-- O código do webhook já foi atualizado para:
-- - Usar supabaseService (com Service Role Key)
-- - Buscar user_id de um paciente existente
-- - Incluir user_id em todos os inserts
-- =====================================================

