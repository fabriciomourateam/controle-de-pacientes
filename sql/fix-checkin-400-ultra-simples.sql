-- =====================================================
-- FIX: Erro 400 (Bad Request) - VERSÃO ULTRA SIMPLES
-- =====================================================
-- Permite acesso total à tabela checkin para usuários autenticados
-- Sem verificar colunas específicas
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.checkin ENABLE ROW LEVEL SECURITY;

-- Remover policy antiga
DROP POLICY IF EXISTS "checkin_select_policy" ON public.checkin;
DROP POLICY IF EXISTS "checkin_select" ON public.checkin;
DROP POLICY IF EXISTS "select_checkin" ON public.checkin;

-- SELECT: Permitir leitura TOTAL para usuários autenticados
-- Versão ULTRA SIMPLES - sem verificações
CREATE POLICY "checkin_select_policy"
ON public.checkin
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'checkin';

-- =====================================================
-- RESUMO
-- =====================================================
-- ✅ Policy criada: permite SELECT para todos autenticados
-- ✅ Sem verificação de colunas (evita erros de coluna não existe)
-- ✅ Acesso total temporário para diagnóstico
-- 
-- NOTA: Esta é uma policy permissiva para resolver o erro 400
-- Depois você pode restringir o acesso se necessário
-- =====================================================
